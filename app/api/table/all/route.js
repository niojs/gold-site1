import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';

// Проверка: авторизован и админ/главный геолог
async function checkAccess() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return { error: 'Не авторизован', status: 401 };
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  const role = user?.role;

  if (!['admin', 'chief_geologist'].includes(role)) {
    return { error: 'Доступ запрещен', status: 403 };
  }

  return { role };
}

// ===== ПОЛУЧИТЬ ВСЕ ДАННЫЕ =====
export async function GET() {
  const access = await checkAccess();
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const drillingResult = await query('SELECT * FROM drilling_records ORDER BY created_at DESC');
    const fieldResult = await query('SELECT * FROM field_data ORDER BY created_at DESC');
    const washingResult = await query('SELECT * FROM washing_data ORDER BY created_at DESC');
    const assayResult = await query('SELECT * FROM assay_data ORDER BY created_at DESC');

    return NextResponse.json({
      drilling: drillingResult.rows,
      field: fieldResult.rows,
      washing: washingResult.rows,
      assay: assayResult.rows,
    });
  } catch (error) {
    console.error('Ошибка загрузки всех данных:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ===== РЕДАКТИРОВАТЬ ЗАПИСЬ =====
export async function PUT(request) {
  const access = await checkAccess();
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { type, record } = await request.json();

    if (!type || !record || !record.id) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
    }

    let result;

    if (type === 'drilling') {
      result = await query(
        `UPDATE drilling_records SET
          site = $1, date = $2, hole_number = $3,
          diameter = $4, start_time = $5, end_time = $6
         WHERE id = $7`,
        [
          record.site,
          record.date,
          record.hole_number,
          parseFloat(record.diameter) || 0,
          record.start_time,
          record.end_time,
          record.id,
        ]
      );
    } else if (type === 'field') {
      result = await query(
        `UPDATE field_data SET
          hole_number = $1, coordinates = $2, line_height = $3,
          intervals = $4, geological_description = $5, ugv = $6,
          date = $7, time = $8, site = $9, diameter = $10, core_recovery = $11
         WHERE id = $12`,
        [
          record.hole_number,
          record.coordinates,
          parseFloat(record.line_height) || 0,
          record.intervals || '',
          record.geological_description || '',
          parseFloat(record.ugv) || 0,
          record.date || '',
          record.time || '',
          record.site,
          parseFloat(record.diameter) || 0,
          parseFloat(record.core_recovery) || 0,
          record.id,
        ]
      );
    } else if (type === 'washing') {
      result = await query(
        `UPDATE washing_data SET
          hole_number = $1, interval = $2, mass = $3,
          volume = $4, visual_description = $5
         WHERE id = $6`,
        [
          record.hole_number,
          record.interval,
          parseFloat(record.mass) || 0,
          parseFloat(record.volume) || 0,
          record.visual_description || '',
          record.id,
        ]
      );
    } else if (type === 'assay') {
      result = await query(
        `UPDATE assay_data SET
          hole_number = $1, interval = $2, reserves = $3,
          marks = $4, sample_weight = $5
         WHERE id = $6`,
        [
          record.hole_number,
          record.interval,
          parseFloat(record.reserves) || 0,
          record.marks || '',
          parseFloat(record.sample_weight) || 0,
          record.id,
        ]
      );
    } else {
      return NextResponse.json({ error: 'Неизвестный тип данных' }, { status: 400 });
    }

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ===== УДАЛИТЬ ЗАПИСЬ =====
export async function DELETE(request) {
  const access = await checkAccess();
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
    }

    const tables = {
      drilling: 'drilling_records',
      field: 'field_data',
      washing: 'washing_data',
      assay: 'assay_data',
    };

    const tableName = tables[type];
    if (!tableName) {
      return NextResponse.json({ error: 'Неизвестный тип данных' }, { status: 400 });
    }

    const result = await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}