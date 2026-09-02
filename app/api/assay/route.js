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
      let sql = `SELECT a.*, u.username as creator_name
         FROM assay_data a LEFT JOIN users u ON a.created_by = u.id`;
      const params = [];
      if (useSiteFilter) {
        sql += ` WHERE a.site = $1`;
        params.push(siteFilter);
      }
      sql += ` ORDER BY a.created_at DESC`;
      const result = await query(sql, params);
      records = result.rows;
    } else if (role === 'sampler') {
      let sql = `SELECT a.*, u.username as creator_name
         FROM assay_data a LEFT JOIN users u ON a.created_by = u.id
         WHERE a.user_id = $1`;
      const params = [sessionId];
      if (useSiteFilter) {
        sql += ` AND a.site = $2`;
        params.push(siteFilter);
      }
      sql += ` ORDER BY a.created_at DESC`;
      const result = await query(sql, params);
      records = result.rows;
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Ошибка загрузки данных анализа:', error);
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
  if (user?.role !== 'sampler' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { holeNumber, interval, reserves, marks, sampleWeight, site } = await request.json();

    if (!holeNumber || !interval || reserves === undefined || !sampleWeight) {
      return NextResponse.json({ error: 'Скважина, интервал, запасы и вес пробы обязательны' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    await query(
      `INSERT INTO assay_data (id, user_id, hole_number, interval, reserves, marks, sample_weight, created_at, created_by, site)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, sessionId, holeNumber, interval, parseFloat(reserves), marks || '', parseFloat(sampleWeight), created_at, sessionId, site || null]
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
  if (user?.role !== 'sampler' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, holeNumber, interval, reserves, marks, sampleWeight, site } = await request.json();

    if (!id || !holeNumber || !interval || reserves === undefined || !sampleWeight) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
    }

    let queryText = `
      UPDATE assay_data SET
        hole_number = $1,
        interval = $2,
        reserves = $3,
        marks = $4,
        sample_weight = $5,
        site = $6
      WHERE id = $7
    `;
    const params = [holeNumber, interval, parseFloat(reserves), marks || '', parseFloat(sampleWeight), site || null, id];

    if (user?.role !== 'admin') {
      queryText += ' AND user_id = $8';
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
  if (user?.role !== 'sampler' && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const ids = Array.isArray(body.id) ? body.id : [body.id];

    if (!ids.length) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    let queryText = `DELETE FROM assay_data WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(',')})`;
    const params = [...ids];

    if (user?.role !== 'admin') {
      queryText += ` AND user_id = $${ids.length + 1}`;
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