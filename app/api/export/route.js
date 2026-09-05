import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';
import * as XLSX from 'xlsx';

export async function GET(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const role = userResult.rows[0]?.role;
  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const format = searchParams.get('format') || 'xlsx';

  // Уважаем выбранный участок (как весь остальной UI).
  const siteFilter = cookieStore.get('selected_site')?.value;
  const useSiteFilter = siteFilter && siteFilter !== '__none__';

  const tables = {
    drilling: { name: 'drilling_records', label: 'Буровые работы', siteCol: 'site' },
    field: { name: 'field_data', label: 'Полевые данные', siteCol: 'site' },
    washing: { name: 'washing_data', label: 'Промывка', siteCol: 'site' },
    assay: { name: 'assay_data', label: 'Пробы', siteCol: 'site' },
    primary: { name: 'primary_survey_data', label: 'Первичное опробование', siteCol: 'work_area' },
  };

  // ===== РУССКИЕ НАЗВАНИЯ КОЛОНОК =====
  const COLUMN_LABELS = {
    drilling: {
      hole_number: 'Скважина',
      site: 'Участок',
      date: 'Дата',
      diameter: 'Диаметр (мм)',
      start_time: 'Начало',
      end_time: 'Конец',
      queue: 'Очередь',
      is_drilled: 'Пробурена',
      project_coordinates: 'Проектные координаты',
      true_coordinates: 'Фактические координаты',
      coordinates: 'Координаты',
    },
    field: {
      hole_number: 'Скважина',
      coordinates: 'Координаты',
      site: 'Участок',
      line_height: 'Линия/высота',
      intervals: 'Интервалы',
      geological_description: 'Геологическое описание',
      ugv: 'УГВ (м)',
      date: 'Дата',
      time: 'Время',
      diameter: 'Диаметр (мм)',
      core_recovery: 'Выход керна (%)',
    },
    washing: {
      hole_number: 'Скважина',
      interval: 'Интервал',
      mass: 'Масса',
      volume: 'Объём',
      visual_description: 'Визуальное описание',
    },
    assay: {
      hole_number: 'Скважина',
      interval: 'Интервал',
      reserves: 'Запасы (т)',
      marks: 'Отметки',
      sample_weight: 'Вес пробы (кг)',
    },
    primary: {
      hole_number: 'Скважина',
      work_area: 'Рабочая область',
      line_name: 'Линия',
      latitude: 'Широта',
      longitude: 'Долгота',
      elevation: 'Высота',
      diameter: 'Диаметр (мм)',
      intervals: 'Интервалы',
      coord_system: 'Система координат',
    },
  };

  // Превращает сырые строки из базы в строки с русскими заголовками
  const translateRows = (tableKey, rows) => {
    const labels = COLUMN_LABELS[tableKey];
    return rows.map((row) => {
      const newRow = {};
      for (const key in labels) {
        let val = row[key];
        if (key === 'date' && val) {
          val = new Date(val).toLocaleDateString('ru-RU');
        }
        if (key === 'is_drilled') {
          val = val ? 'Да' : 'Нет';
        }
        newRow[labels[key]] = val ?? '';
      }
      return newRow;
    });
  };

  try {
    // ===== СОБИРАЕМ ДАННЫЕ =====
    let sheets = []; // [{ key, label, data }]

    const fetchTable = async (key) => {
      const t = tables[key];
      if (useSiteFilter) {
        return query(`SELECT * FROM ${t.name} WHERE ${t.siteCol} = $1`, [siteFilter]);
      }
      return query(`SELECT * FROM ${t.name}`);
    };

    if (table && tables[table]) {
      const result = await fetchTable(table);
      sheets.push({
        key: table,
        label: tables[table].label,
        data: translateRows(table, result.rows),
      });
    } else {
      for (const key of Object.keys(tables)) {
        const result = await fetchTable(key);
        sheets.push({
          key,
          label: tables[key].label,
          data: translateRows(key, result.rows),
        });
      }
    }

    const hasData = sheets.some((s) => s.data.length > 0);
    if (!hasData) {
      return new Response('Нет данных для экспорта', { status: 404 });
    }

    const fileName = table ? tables[table].label : 'Все данные';

    // ===== ФОРМАТ CSV =====
    if (format === 'csv') {
      let csvContent = '';

      for (const sheet of sheets) {
        if (sheet.data.length === 0) continue;

        // Заголовок секции (если экспортируем несколько таблиц)
        if (!table) {
          csvContent += `${sheet.label}\n`;
        }

        const headers = Object.keys(sheet.data[0]);
        csvContent += headers.join(';') + '\n';

        for (const row of sheet.data) {
          const values = headers.map((h) => {
            let value = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
            if (value.includes('"') || value.includes(';') || value.includes('\n')) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvContent += values.join(';') + '\n';
        }

        csvContent += '\n'; // пустая строка между таблицами
      }

      const finalContent = '\uFEFF' + csvContent;
      return new Response(finalContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.csv"`,
        },
      });
    }

    // ===== ФОРМАТ EXCEL =====
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
      if (sheet.data.length === 0) continue;
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);

      // Автоширина колонок
      const cols = Object.keys(sheet.data[0]).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...sheet.data.map((row) => (row[key] ? String(row[key]).length : 0))
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });
      worksheet['!cols'] = cols;

      const sheetName = sheet.label.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    return NextResponse.json({ error: 'Ошибка экспорта: ' + error.message }, { status: 500 });
  }
}