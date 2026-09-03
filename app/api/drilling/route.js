import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    const siteFilter = cookieStore.get('selected_site')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
    const user = userResult.rows[0];
    const role = user?.role;
    const useSiteFilter = siteFilter && siteFilter !== '__none__';

    let records = [];

    if (role === 'admin' || role === 'chief_geologist') {
      let sql = `SELECT d.*, u.username as creator_name
         FROM drilling_records d
         LEFT JOIN users u ON d.created_by = u.id`;
      const params = [];
      if (useSiteFilter) {
        sql += ` WHERE d.site = $1`;
        params.push(siteFilter);
      }
      sql += ` ORDER BY d.created_at DESC`;
      const result = await query(sql, params);
      records = result.rows;
    } else if (role === 'driller') {
      let sql = `SELECT d.*, u.username as creator_name
         FROM drilling_records d
         LEFT JOIN users u ON d.created_by = u.id
         WHERE d.user_id = $1`;
      const params = [sessionId];
      if (useSiteFilter) {
        sql += ` AND d.site = $2`;
        params.push(siteFilter);
      }
      sql += ` ORDER BY d.created_at DESC`;
      const result = await query(sql, params);
      records = result.rows;
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Ошибка загрузки буровых:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  if (user?.role !== 'driller' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { site, date, holeNumber, diameter, startTime, endTime, brigade, queue, isDrilled, coordinates } = await request.json();

    if (!holeNumber) {
      return NextResponse.json({ error: 'Номер скважины обязателен' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    await query(
      `INSERT INTO drilling_records 
       (id, user_id, site, date, hole_number, diameter, start_time, end_time, created_at, created_by, brigade, queue, is_drilled, coordinates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, sessionId, site || null, date || null, holeNumber, diameter ? parseFloat(diameter) : null, startTime || null, endTime || null, created_at, sessionId, brigade || null, queue ? parseInt(queue) : null, isDrilled ? 1 : 0, coordinates || null]
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
  if (user?.role !== 'driller' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, site, date, holeNumber, diameter, startTime, endTime, brigade, queue, isDrilled, coordinates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let queryText = `
      UPDATE drilling_records SET
        site = $1, date = $2, hole_number = $3, diameter = $4,
        start_time = $5, end_time = $6, brigade = $7, queue = $8, is_drilled = $9, coordinates = $10
      WHERE id = $11
    `;
    const params = [site || null, date || null, holeNumber, diameter ? parseFloat(diameter) : null, startTime || null, endTime || null, brigade || null, queue ? parseInt(queue) : null, isDrilled ? 1 : 0, coordinates || null, id];

    if (user?.role !== 'admin') {
      queryText += ' AND user_id = $12';
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
  if (user?.role !== 'driller' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let queryText = 'DELETE FROM drilling_records WHERE id = $1';
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
