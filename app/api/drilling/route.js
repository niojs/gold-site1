import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const stmt = db.prepare('SELECT * FROM drilling_records WHERE user_id = ? ORDER BY created_at DESC');
  const records = stmt.all(sessionId);
  return NextResponse.json(records);
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { site, date, holeNumber, diameter, startTime, endTime } = await request.json();

    if (!site || !date || !holeNumber || !diameter || !startTime || !endTime) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    // Исправленный запрос с полями start_time и end_time
    const stmt = db.prepare(`
      INSERT INTO drilling_records 
      (id, user_id, site, date, hole_number, diameter, start_time, end_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      site,
      date,
      holeNumber,
      parseFloat(diameter),
      startTime,   // <-- теперь сохраняется
      endTime,     // <-- теперь сохраняется
      created_at
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}