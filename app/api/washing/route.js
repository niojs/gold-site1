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
    const result = await query('SELECT * FROM washing_data ORDER BY created_at DESC');
    records = result.rows;
  } else if (role === 'washer') {
    const result = await query('SELECT * FROM washing_data WHERE user_id = $1 ORDER BY created_at DESC', [sessionId]);
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

    await query(
      `INSERT INTO washing_data (id, user_id, hole_number, interval, mass, volume, visual_description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, sessionId, holeNumber, interval, parseFloat(mass), parseFloat(volume), visualDescription || '', created_at]
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
  if (user?.role !== 'washer' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, holeNumber, interval, mass, volume, visualDescription } = await request.json();

    if (!id || !holeNumber || !interval || !mass || !volume) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
    }

    let queryText = `
      UPDATE washing_data SET
        hole_number = $1,
        interval = $2,
        mass = $3,
        volume = $4,
        visual_description = $5
      WHERE id = $6
    `;
    const params = [holeNumber, interval, parseFloat(mass), parseFloat(volume), visualDescription || '', id];

    if (user?.role !== 'admin') {
      queryText += ' AND user_id = $7';
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
  if (user?.role !== 'washer' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let queryText = 'DELETE FROM washing_data WHERE id = $1';
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