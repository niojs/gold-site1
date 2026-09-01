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

  const managed = await query('SELECT * FROM sites ORDER BY name');
  const managedNames = new Set(managed.rows.map(r => r.name));

  const extra = [];

  const drilling = await query(`SELECT DISTINCT site FROM drilling_records WHERE site IS NOT NULL AND site != ''`);
  for (const r of drilling.rows) { if (!managedNames.has(r.site)) { extra.push(r.site); managedNames.add(r.site); } }

  const primary = await query(`SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL AND work_area != ''`);
  for (const r of primary.rows) { if (!managedNames.has(r.work_area)) { extra.push(r.work_area); managedNames.add(r.work_area); } }

  const field = await query(`SELECT DISTINCT site FROM field_data WHERE site IS NOT NULL AND site != ''`);
  for (const r of field.rows) { if (!managedNames.has(r.site)) { extra.push(r.site); managedNames.add(r.site); } }

  const washing = await query(`SELECT DISTINCT site FROM washing_data WHERE site IS NOT NULL AND site != ''`);
  for (const r of washing.rows) { if (!managedNames.has(r.site)) { extra.push(r.site); managedNames.add(r.site); } }

  const assay = await query(`SELECT DISTINCT site FROM assay_data WHERE site IS NOT NULL AND site != ''`);
  for (const r of assay.rows) { if (!managedNames.has(r.site)) { extra.push(r.site); managedNames.add(r.site); } }

  const userSitesResult = await query(`SELECT DISTINCT site_name FROM user_sites WHERE site_name IS NOT NULL AND site_name != ''`);
  for (const r of userSitesResult.rows) { if (!managedNames.has(r.site_name)) { extra.push(r.site_name); managedNames.add(r.site_name); } }

  const allSites = [
    ...managed.rows.map(r => ({ id: r.id, name: r.name, created_at: r.created_at, managed: true })),
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
