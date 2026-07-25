import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

// ========== ПОЛУЧИТЬ ЗАПИСИ ==========
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  const role = user?.role;

  let records = [];

  if (role === 'admin' || role === 'chief_geologist') {
    const stmt = db.prepare('SELECT * FROM washing_data ORDER BY created_at DESC');
    records = stmt.all();
  } else if (role === 'washer') {
    const stmt = db.prepare('SELECT * FROM washing_data WHERE user_id = ? ORDER BY created_at DESC');
    records = stmt.all(sessionId);
  } else {
    records = [];
  }

  return NextResponse.json(records);
}

// ========== ДОБАВИТЬ ЗАПИСЬ ==========
export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'washer' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { holeNumber, interval, mass, volume, visualDescription } = await request.json();

    if (!holeNumber || !interval || !mass || !volume) {
      return NextResponse.json({ error: 'Номер скважины, интервал, масса и объём обязательны' }, { status: 400 });
    }

    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO washing_data (id, user_id, hole_number, interval, mass, volume, visual_description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, sessionId, holeNumber, interval, parseFloat(mass), parseFloat(volume), visualDescription || '', created_at);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения данных промывки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== РЕДАКТИРОВАТЬ ЗАПИСЬ ==========
export async function PUT(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'washer' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, holeNumber, interval, mass, volume, visualDescription } = await request.json();

    if (!id || !holeNumber || !interval || !mass || !volume) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
    }

    let query = `
      UPDATE washing_data SET
        hole_number = ?,
        interval = ?,
        mass = ?,
        volume = ?,
        visual_description = ?
      WHERE id = ?
    `;
    const params = [holeNumber, interval, parseFloat(mass), parseFloat(volume), visualDescription || '', id];

    if (user?.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(sessionId);
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Запись не найдена или доступ запрещен' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления данных промывки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== УДАЛИТЬ ЗАПИСЬ ==========
export async function DELETE(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'washer' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let query = 'DELETE FROM washing_data WHERE id = ?';
    const params = [id];

    if (user?.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(sessionId);
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Запись не найдена или доступ запрещен' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления данных промывки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}