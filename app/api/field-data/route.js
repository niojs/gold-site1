import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  const role = user?.role;

  let records = [];

  if (role === 'admin' || role === 'chief_geologist') {
    const result = await query(
      `SELECT f.*, u.username as creator_name
       FROM field_data f
       LEFT JOIN users u ON f.created_by = u.id
       ORDER BY f.created_at DESC`
    );
    records = result.rows;
  } else if (role === 'field_geologist') {
    const result = await query(
      `SELECT f.*, u.username as creator_name
       FROM field_data f
       LEFT JOIN users u ON f.created_by = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [sessionId]
    );
    records = result.rows;
  }

  return NextResponse.json(records);
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  if (user?.role !== 'field_geologist' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const {
      holeNumber, coordinates, lineHeight, intervals,
      geologicalDescription, ugv, date, time, site,
      diameter, coreRecovery, brigade,
    } = await request.json();

    if (!holeNumber || !coordinates || !site) {
      return NextResponse.json({ error: 'Номер скважины, координаты и участок обязательны' }, { status: 400 });
    }

    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    await query(
      `INSERT INTO field_data (
        id, user_id, hole_number, coordinates, line_height, intervals,
        geological_description, ugv, date, time, site, diameter, core_recovery, created_at, created_by, brigade
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id, sessionId, holeNumber, coordinates,
        parseFloat(lineHeight) || 0, intervals || '',
        geologicalDescription || '', parseFloat(ugv) || 0,
        date || '', time || '', site,
        parseFloat(diameter) || 0, parseFloat(coreRecovery) || 0,
        created_at, sessionId, brigade || null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  if (user?.role !== 'field_geologist' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const {
      id, holeNumber, coordinates, lineHeight, intervals,
      geologicalDescription, ugv, date, time, site,
      diameter, coreRecovery, brigade,
    } = await request.json();

    if (!id || !holeNumber || !coordinates || !site) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
    }

    let queryText = `
      UPDATE field_data SET
        hole_number = $1, coordinates = $2, line_height = $3, intervals = $4,
        geological_description = $5, ugv = $6, date = $7, time = $8,
        site = $9, diameter = $10, core_recovery = $11, brigade = $12
      WHERE id = $13
    `;
    const params = [
      holeNumber, coordinates, parseFloat(lineHeight) || 0,
      intervals || '', geologicalDescription || '', parseFloat(ugv) || 0,
      date || '', time || '', site, parseFloat(diameter) || 0,
      parseFloat(coreRecovery) || 0, brigade || null, id,
    ];

    if (user?.role !== 'admin') {
      queryText += ' AND user_id = $14';
      params.push(sessionId);
    }

    const result = await query(queryText, params);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена или доступ запрещен' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  if (user?.role !== 'field_geologist' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let queryText = 'DELETE FROM field_data WHERE id = $1';
    const params = [id];

    if (user?.role !== 'admin') {
      queryText += ' AND user_id = $2';
      params.push(sessionId);
    }

    const result = await query(queryText, params);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена или доступ запрещен' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
