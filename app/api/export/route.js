import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

export async function GET(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  const role = user?.role;

  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  const tables = {
    drilling: 'drilling_records',
    field: 'field_data',
    washing: 'washing_data',
    assay: 'assay_data',
  };

  let data = [];
  let fileName = 'all_data';

  if (table && tables[table]) {
    data = db.prepare(`SELECT * FROM ${tables[table]}`).all();
    fileName = table;
  } else {
    const drilling = db.prepare('SELECT * FROM drilling_records').all();
    const field = db.prepare('SELECT * FROM field_data').all();
    const washing = db.prepare('SELECT * FROM washing_data').all();
    const assay = db.prepare('SELECT * FROM assay_data').all();
    data = [...drilling, ...field, ...washing, ...assay];
  }

  if (data.length === 0) {
    return new Response('Нет данных для экспорта', { status: 404 });
  }

  // Формируем CSV с разделителем ; и экранируем кавычки
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(';'));

  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header] !== undefined ? String(row[header]) : '';
      // Экранируем кавычки и оборачиваем в кавычки, если есть ; или "
      if (value.includes('"') || value.includes(';') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(';'));
  }

  const csvContent = csvRows.join('\n');
  // Добавляем BOM для Excel (UTF-8 с BOM)
  const bom = '\uFEFF';
  const finalContent = bom + csvContent;

  return new Response(finalContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}_export.csv"`,
    },
  });
}