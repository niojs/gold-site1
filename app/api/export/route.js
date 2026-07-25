import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

export async function GET(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
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
    const result = await query(`SELECT * FROM ${tables[table]}`);
    data = result.rows;
    fileName = table;
  } else {
    const drilling = await query('SELECT * FROM drilling_records');
    const field = await query('SELECT * FROM field_data');
    const washing = await query('SELECT * FROM washing_data');
    const assay = await query('SELECT * FROM assay_data');
    data = [...drilling.rows, ...field.rows, ...washing.rows, ...assay.rows];
  }

  if (data.length === 0) {
    return new Response('Нет данных для экспорта', { status: 404 });
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(';'));

  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header] !== undefined ? String(row[header]) : '';
      if (value.includes('"') || value.includes(';') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(';'));
  }

  const csvContent = csvRows.join('\n');
  const bom = '\uFEFF';
  const finalContent = bom + csvContent;

  return new Response(finalContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}_export.csv"`,
    },
  });
}