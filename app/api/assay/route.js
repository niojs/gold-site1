import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

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
    const stmt = db.prepare('SELECT * FROM assay_data ORDER BY created_at DESC');
    records = stmt.all();
  } else if (role === 'sampler') {
    const stmt = db.prepare('SELECT * FROM assay_data WHERE user_id = ? ORDER BY created_at DESC');
    records = stmt.all(sessionId);
  } else {
    records = [];
  }

  return NextResponse.json(records);
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'sampler' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { holeNumber, interval, reserves, marks, sampleWeight } = await request.json();

    if (!holeNumber || !interval || reserves === undefined || !sampleWeight) {
      return NextResponse.json({ error: 'Скважина, интервал, запасы и вес пробы обязательны' }, { status: 400 });
    }

    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO assay_data (id, user_id, hole_number, interval, reserves, marks, sample_weight, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, sessionId, holeNumber, interval, parseFloat(reserves), marks || '', parseFloat(sampleWeight), created_at);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения данных проб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'sampler' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, holeNumber, interval, reserves, marks, sampleWeight } = await request.json();

    if (!id || !holeNumber || !interval || reserves === undefined || !sampleWeight) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
    }

    let query = `
      UPDATE assay_data SET
        hole_number = ?,
        interval = ?,
        reserves = ?,
        marks = ?,
        sample_weight = ?
      WHERE id = ?
    `;
    const params = [holeNumber, interval, parseFloat(reserves), marks || '', parseFloat(sampleWeight), id];

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
    console.error('Ошибка обновления данных проб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'sampler' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let query = 'DELETE FROM assay_data WHERE id = ?';
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
    console.error('Ошибка удаления данных проб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}