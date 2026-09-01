import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

const CAN_MANAGE = ['admin', 'chief_geologist'];

async function getUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return null;
  const result = await query('SELECT * FROM users WHERE id = $1', [sessionId]);
  return result.rows[0] || null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const result = await query(
    `SELECT p.*, u.username as creator_name
     FROM primary_survey_data p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.work_area, p.line_name, p.hole_number`
  );

  const sitesResult = await query('SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL');
  const sites = sitesResult.rows.map(r => r.work_area).filter(Boolean);

  return NextResponse.json({ records: result.rows, sites });
}

export async function POST(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const body = await request.json();
  const { lineName, latitude, longitude, elevation, workArea, holeNumber, diameter, intervals } = body;

  if (!workArea || !holeNumber) {
    return NextResponse.json({ error: 'Участок и номер скважины обязательны' }, { status: 400 });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  await query(
    `INSERT INTO primary_survey_data (id, user_id, line_name, latitude, longitude, elevation, work_area, hole_number, diameter, intervals, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, user.id, lineName || null, latitude || null, longitude || null, elevation || null, workArea, holeNumber, diameter || null, intervals || null, new Date().toISOString()]
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
  const { id, lineName, latitude, longitude, elevation, workArea, holeNumber, diameter, intervals } = body;

  if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });

  const result = await query(
    `UPDATE primary_survey_data SET line_name=$1, latitude=$2, longitude=$3, elevation=$4, work_area=$5, hole_number=$6, diameter=$7, intervals=$8 WHERE id=$9`,
    [lineName || null, latitude || null, longitude || null, elevation || null, workArea, holeNumber, diameter || null, intervals || null, id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
  }

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

  const result = await query('DELETE FROM primary_survey_data WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
