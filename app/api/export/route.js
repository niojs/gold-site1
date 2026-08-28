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
  const format = searchParams.get('format') || 'xlsx'; // xlsx или csv

  const tables = {
    drilling: { name: 'drilling_records', label: 'Буровые работы' },
    field: { name: 'field_data', label: 'Полевые данные' },
    washing: { name: 'washing_data', label: 'Промывка' },
    assay: { name: 'assay_data', label: 'Пробы' },
  };

  try {
    // ===== СОБИРАЕМ ДАННЫЕ =====
    let sheets = []; // [{ label, data }]

    if (table && tables[table]) {
      const result = await query(`SELECT * FROM ${tables[table].name}`);
      sheets.push({ label: tables[table].label, data: result.rows });
    } else {
      // Все таблицы
      for (const key of Object.keys(tables)) {
        const result = await query(`SELECT * FROM ${tables[key].name}`);
        sheets.push({ label: tables[key].label, data: result.rows });
      }
    }

    const hasData = sheets.some((s) => s.data.length > 0);
    if (!hasData) {
      return new Response('Нет данных для экспорта', { status: 404 });
    }

    const fileName = table ? table : 'all_data';

    // ===== ФОРМАТ CSV =====
    if (format === 'csv') {
      // CSV — только первая таблица (или объединённая)
      const allData = sheets.flatMap((s) => s.data);
      if (allData.length === 0) return new Response('Нет данных', { status: 404 });

      const headers = Object.keys(allData[0]);
      const csvRows = [headers.join(';')];
      for (const row of allData) {
        const values = headers.map((h) => {
          let value = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
          if (value.includes('"') || value.includes(';') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(values.join(';'));
      }
      const finalContent = '\uFEFF' + csvRows.join('\n');
      return new Response(finalContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}_export.csv"`,
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

      // Имя листа (макс 31 символ — ограничение Excel)
      const sheetName = sheet.label.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}_export.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    return NextResponse.json({ error: 'Ошибка экспорта: ' + error.message }, { status: 500 });
  }
}