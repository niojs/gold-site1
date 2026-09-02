import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';
import * as XLSX from 'xlsx';

const TABLE_COLUMNS = {
  drilling_records: ['id', 'user_id', 'site', 'date', 'hole_number', 'diameter', 'start_time', 'end_time', 'coordinates', 'created_at', 'queue', 'is_drilled', 'project_coordinates', 'true_coordinates'],
  field_data: ['id', 'user_id', 'hole_number', 'coordinates', 'line_height', 'intervals', 'geological_description', 'ugv', 'date', 'time', 'site', 'diameter', 'core_recovery', 'created_at'],
  washing_data: ['id', 'user_id', 'hole_number', 'interval', 'mass', 'volume', 'visual_description', 'created_at'],
  assay_data: ['id', 'user_id', 'hole_number', 'interval', 'reserves', 'marks', 'sample_weight', 'created_at'],
  primary_survey_data: ['id', 'hole_number', 'work_area', 'line_name', 'latitude', 'longitude', 'elevation', 'diameter', 'intervals', 'coord_system', 'created_at'],
};

// Ключ уникальности: по каким полям считаем запись "той же самой"
const UNIQUE_KEYS = {
  drilling_records: ['hole_number'],
  field_data: ['hole_number', 'intervals'],
  washing_data: ['hole_number', 'interval'],
  assay_data: ['hole_number', 'interval'],
  primary_survey_data: ['hole_number', 'work_area'],
};

const RU_TO_EN = {
  'Скважина': 'hole_number',
  'Участок': 'site',
  'Дата': 'date',
  'Диаметр (мм)': 'diameter',
  'Начало': 'start_time',
  'Конец': 'end_time',
  'Очередь': 'queue',
  'Пробурена': 'is_drilled',
  'Проектные координаты': 'project_coordinates',
  'Фактические координаты': 'true_coordinates',
  'Координаты': 'coordinates',
  'Линия/высота': 'line_height',
  'Интервалы': 'intervals',
  'Геологическое описание': 'geological_description',
  'УГВ (м)': 'ugv',
  'Время': 'time',
  'Выход керна (%)': 'core_recovery',
  'Интервал': 'interval',
  'Масса': 'mass',
  'Объём': 'volume',
  'Визуальное описание': 'visual_description',
  'Запасы (т)': 'reserves',
  'Отметки': 'marks',
  'Вес пробы (кг)': 'sample_weight',
  'Рабочая область': 'work_area',
  'Линия': 'line_name',
  'Широта': 'latitude',
  'Долгота': 'longitude',
  'Высота': 'elevation',
  'Система координат': 'coord_system',
  'Первичное опробование': 'primary',
};

function normalizeHeader(header) {
  const h = header.trim();
  return RU_TO_EN[h] || h;
}

function detectTable(headers) {
  if (headers.includes('diameter') && (headers.includes('start_time') || headers.includes('queue'))) return 'drilling_records';
  if (headers.includes('ugv') || headers.includes('geological_description') || headers.includes('core_recovery')) return 'field_data';
  if (headers.includes('mass') && headers.includes('volume')) return 'washing_data';
  if (headers.includes('reserves') || headers.includes('sample_weight')) return 'assay_data';
  if (headers.includes('latitude') || headers.includes('longitude') || headers.includes('coord_system')) return 'primary_survey_data';
  if (headers.includes('diameter')) return 'drilling_records';
  return null;
}

function normalizeDate(val) {
  if (!val) return val;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
}

// Проверка: значение "пустое"?
function isEmpty(v) {
  return v === '' || v === null || v === undefined;
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const role = userResult.rows[0]?.role;
  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });

    const fileName = file.name.toLowerCase();
    let rawRows = [];

    // ===== ЧТЕНИЕ ФАЙЛА =====
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      if (lines.length < 2) {
        return NextResponse.json({ error: 'Файл пуст' }, { status: 400 });
      }
      const headers = lines[0].split(';').map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map((v) => {
          let val = v.trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          return val;
        });
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        rawRows.push(row);
      }
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'Нет данных в файле' }, { status: 400 });
    }

    // ===== ПЕРЕВОДИМ ЗАГОЛОВКИ =====
    const rows = rawRows.map((rawRow) => {
      const row = {};
      for (const key of Object.keys(rawRow)) {
        row[normalizeHeader(key)] = rawRow[key];
      }
      return row;
    });

    // ===== ОПРЕДЕЛЯЕМ ТАБЛИЦУ =====
    const fileHeaders = Object.keys(rows[0]);
    const tableName = detectTable(fileHeaders);
    if (!tableName) {
      return NextResponse.json({
        error: 'Не удалось определить тип данных. Проверьте заголовки столбцов.',
      }, { status: 400 });
    }

    const validColumns = TABLE_COLUMNS[tableName];
    const uniqueKeys = UNIQUE_KEYS[tableName];

    let insertedCount = 0;  // новые записи
    let mergedCount = 0;    // дозаполнены
    let skippedCount = 0;   // пустые
    let errorCount = 0;

    // ===== ОБРАБОТКА КАЖДОЙ СТРОКИ =====
    for (const rawRow of rows) {
      // чистим и конвертируем
      const row = {};
      for (const key of Object.keys(rawRow)) {
        const col = key.trim();
        if (validColumns.includes(col)) {
          let value = rawRow[key];
          if (col === 'is_drilled') {
            const v = String(value).trim().toLowerCase();
            value = (v === 'да' || v === 'true' || v === '1');
          } else if (col === 'date') {
            value = normalizeDate(value);
          }
          row[col] = value;
        }
      }

      // пропускаем строки без скважины
      if (isEmpty(row.hole_number)) {
        skippedCount++;
        continue;
      }

      // ===== ИЩЕМ СУЩЕСТВУЮЩУЮ ЗАПИСЬ (по ключу уникальности) =====
      const whereClauses = [];
      const whereValues = [];
      uniqueKeys.forEach((k, i) => {
        whereClauses.push(`${k} = $${i + 1}`);
        whereValues.push(row[k] ?? '');
      });

      const existing = await query(
        `SELECT * FROM ${tableName} WHERE ${whereClauses.join(' AND ')} LIMIT 1`,
        whereValues
      );

      if (existing.rows.length > 0) {
        // ===== ДУБЛЬ НАЙДЕН → ДОЗАПОЛНЯЕМ ПУСТЫЕ =====
        const dbRow = existing.rows[0];
        const updates = [];
        const updateValues = [];
        let idx = 1;

        for (const col of Object.keys(row)) {
          // не трогаем ключевые поля и служебные
          if (uniqueKeys.includes(col) || col === 'id' || col === 'user_id' || col === 'created_at') continue;
          // заполняем только если на сайте ПУСТО, а в файле есть значение
          if (isEmpty(dbRow[col]) && !isEmpty(row[col])) {
            updates.push(`${col} = $${idx}`);
            updateValues.push(row[col]);
            idx++;
          }
        }

        if (updates.length > 0) {
          updateValues.push(dbRow.id);
          try {
            await query(
              `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = $${idx}`,
              updateValues
            );
            mergedCount++;
          } catch (e) {
            errorCount++;
            console.error('Ошибка обновления:', e.message);
          }
        } else {
          skippedCount++; // дубль без новых данных
        }
      } else {
        // ===== НОВАЯ ЗАПИСЬ → ВСТАВЛЯЕМ =====
        const insertRow = {};
        for (const col of Object.keys(row)) {
          if (!isEmpty(row[col])) insertRow[col] = row[col];
        }

        if (isEmpty(insertRow.id)) insertRow.id = Date.now().toString() + Math.floor(Math.random() * 1000);
        if (isEmpty(insertRow.user_id)) insertRow.user_id = sessionId;
        if (isEmpty(insertRow.created_at)) insertRow.created_at = new Date().toISOString();

        const cols = Object.keys(insertRow);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const values = cols.map((c) => insertRow[c]);

        try {
          await query(
            `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`,
            values
          );
          insertedCount++;
        } catch (e) {
          errorCount++;
          console.error('Ошибка вставки:', e.message);
        }
      }
    }

    const tableLabels = {
      drilling_records: 'Буровые работы',
      field_data: 'Полевые данные',
      washing_data: 'Промывка',
  assay_data: 'Пробы',
  primary_survey_data: 'Первичное опробование',
};

    let msg = `«${tableLabels[tableName]}»: добавлено ${insertedCount}`;
    if (mergedCount) msg += `, дозаполнено ${mergedCount}`;
    if (skippedCount) msg += `, пропущено ${skippedCount}`;
    if (errorCount) msg += `, ошибок ${errorCount}`;

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error('Ошибка импорта:', error);
    return NextResponse.json({ error: 'Ошибка импорта: ' + error.message }, { status: 500 });
  }
}