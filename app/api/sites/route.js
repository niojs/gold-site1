import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

const CAN_MANAGE = ['admin', 'chief_geologist'];

async function getUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return null;
  const result = await query('SELECT id, username, role FROM users WHERE id = $1', [sessionId]);
  return result.rows[0] || null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const managedNames = new Set();
  const managedRows = [];
  const extra = [];

  try {
    const managed = await query('SELECT * FROM sites ORDER BY name');
    for (const r of managed.rows) { managedNames.add(r.name); managedRows.push(r); }
  } catch (e) { /* sites table may not exist */ }

  async function addFromTable(sql, field) {
    try {
      const result = await query(sql);
      for (const r of result.rows) {
        const val = r[field];
        if (val && !managedNames.has(val)) { extra.push(val); managedNames.add(val); }
      }
    } catch (e) { /* table/column may not exist */ }
  }

  await addFromTable(`SELECT DISTINCT site FROM drilling_records WHERE site IS NOT NULL AND site != ''`, 'site');
  await addFromTable(`SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL AND work_area != ''`, 'work_area');
  await addFromTable(`SELECT DISTINCT site FROM field_data WHERE site IS NOT NULL AND site != ''`, 'site');
  await addFromTable(`SELECT DISTINCT site FROM washing_data WHERE site IS NOT NULL AND site != ''`, 'site');
  await addFromTable(`SELECT DISTINCT site FROM assay_data WHERE site IS NOT NULL AND site != ''`, 'site');
  await addFromTable(`SELECT DISTINCT site_name FROM user_sites WHERE site_name IS NOT NULL AND site_name != ''`, 'site_name');

  const allSites = [
    ...managedRows.map(r => ({ id: r.id, name: r.name, created_at: r.created_at, managed: true })),
    ...extra.map(name => ({ id: null, name, created_at: null, managed: false })),
  ];

  return NextResponse.json(allSites);
}

export async function POST(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Название участка обязательно' }, { status: 400 });
  }

  const trimmed = name.trim();

  const existing = await query('SELECT id FROM sites WHERE name = $1', [trimmed]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Участок с таким названием уже существует' }, { status: 409 });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  await query(
    `INSERT INTO sites (id, name, created_at) VALUES ($1, $2, $3)`,
    [id, trimmed, new Date().toISOString()]
  );

  return NextResponse.json({ id, success: true });
}

export async function PUT(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const body = await request.json();
  const { id, name } = body;

  if (!id || !name || !name.trim()) {
    return NextResponse.json({ error: 'ID и название обязательны' }, { status: 400 });
  }

  const trimmed = name.trim();

  const existing = await query('SELECT id FROM sites WHERE name = $1 AND id != $2', [trimmed, id]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Участок с таким названием уже существует' }, { status: 409 });
  }

  await query('UPDATE sites SET name = $1 WHERE id = $2', [trimmed, id]);

  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });

  await query('DELETE FROM sites WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
