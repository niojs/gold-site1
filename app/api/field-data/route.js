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
    // Админ и главный геолог видят все записи
    const stmt = db.prepare('SELECT * FROM field_data ORDER BY created_at DESC');
    records = stmt.all();
  } else if (role === 'field_geologist') {
    // Полевой геолог видит только свои записи
    const stmt = db.prepare('SELECT * FROM field_data WHERE user_id = ? ORDER BY created_at DESC');
    records = stmt.all(sessionId);
  } else {
    // Остальные роли не видят полевые данные
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

  // Проверяем, что пользователь — полевой геолог
  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'field_geologist' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const {
      holeNumber,
      coordinates,
      lineHeight,
      intervals,
      geologicalDescription,
      ugv,
      date,
      time,
      site,
      diameter,
      coreRecovery,
    } = await request.json();

    if (!holeNumber || !coordinates || !site) {
      return NextResponse.json({ error: 'Номер скважины, координаты и участок обязательны' }, { status: 400 });
    }

    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO field_data (
        id, user_id, hole_number, coordinates, line_height, intervals,
        geological_description, ugv, date, time, site, diameter, core_recovery, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      holeNumber,
      coordinates,
      parseFloat(lineHeight) || 0,
      intervals || '',
      geologicalDescription || '',
      parseFloat(ugv) || 0,
      date || '',
      time || '',
      site,
      parseFloat(diameter) || 0,
      parseFloat(coreRecovery) || 0,
      created_at
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения полевых данных:', error);
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

  // Проверяем права
  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'field_geologist' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const {
      id,
      holeNumber,
      coordinates,
      lineHeight,
      intervals,
      geologicalDescription,
      ugv,
      date,
      time,
      site,
      diameter,
      coreRecovery,
    } = await request.json();

    if (!id || !holeNumber || !coordinates || !site) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
    }

    // Проверяем, что запись принадлежит пользователю (или он админ)
    let query = `
      UPDATE field_data SET
        hole_number = ?,
        coordinates = ?,
        line_height = ?,
        intervals = ?,
        geological_description = ?,
        ugv = ?,
        date = ?,
        time = ?,
        site = ?,
        diameter = ?,
        core_recovery = ?
      WHERE id = ?
    `;
    const params = [
      holeNumber,
      coordinates,
      parseFloat(lineHeight) || 0,
      intervals || '',
      geologicalDescription || '',
      parseFloat(ugv) || 0,
      date || '',
      time || '',
      site,
      parseFloat(diameter) || 0,
      parseFloat(coreRecovery) || 0,
      id,
    ];

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
    console.error('Ошибка обновления полевых данных:', error);
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

  // Проверяем права
  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  if (user?.role !== 'field_geologist' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let query = 'DELETE FROM field_data WHERE id = ?';
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
    console.error('Ошибка удаления полевых данных:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}