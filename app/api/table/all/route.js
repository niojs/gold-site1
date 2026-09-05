import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';

// Проверка: авторизован и админ/главный геолог
async function checkAccess() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return { error: 'Не авторизован', status: 401 };
  }

  const userResult = await query('SELECT id, username, role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  const role = user?.role;

  if (!['admin', 'chief_geologist'].includes(role)) {
    return { error: 'Доступ запрещен', status: 403 };
  }

  return { role, userId: user.id, username: user.username };
}

// ===== ПОЛУЧИТЬ ВСЕ ДАННЫЕ =====
export async function GET() {
  const access = await checkAccess();
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const cookieStore = await cookies();
  const siteFilter = cookieStore.get('selected_site')?.value;
  const useSiteFilter = siteFilter && siteFilter !== '__none__';

  try {
    let drillingSql = `SELECT d.*, u.username as creator_name FROM drilling_records d LEFT JOIN users u ON COALESCE(d.created_by, d.user_id) = u.id`;
    let fieldSql = `SELECT f.*, u.username as creator_name FROM field_data f LEFT JOIN users u ON COALESCE(f.created_by, f.user_id) = u.id`;
    let washingSql = `SELECT w.*, u.username as creator_name FROM washing_data w LEFT JOIN users u ON COALESCE(w.created_by, w.user_id) = u.id`;
    let assaySql = `SELECT a.*, u.username as creator_name FROM assay_data a LEFT JOIN users u ON COALESCE(a.created_by, a.user_id) = u.id`;
    let primarySql = `SELECT p.*, u.username as creator_name FROM primary_survey_data p LEFT JOIN users u ON p.user_id = u.id`;
    const whereClauses = [];

    if (useSiteFilter) {
      whereClauses.push(siteFilter);
    }

    if (useSiteFilter) {
      drillingSql += ` WHERE d.site = $1`;
      fieldSql += ` WHERE f.site = $1`;
      washingSql += ` WHERE w.site = $1`;
      assaySql += ` WHERE a.site = $1`;
      primarySql += ` WHERE p.work_area = $1`;
    }

    drillingSql += ' ORDER BY created_at DESC';
    fieldSql += ' ORDER BY created_at DESC';
    washingSql += ' ORDER BY created_at DESC';
    assaySql += ' ORDER BY created_at DESC';
    primarySql += ' ORDER BY created_at DESC';

    const drillingResult = await query(drillingSql, whereClauses);
    const fieldResult = await query(fieldSql, whereClauses);
    const washingResult = await query(washingSql, whereClauses);
    const assayResult = await query(assaySql, whereClauses);
    const primaryResult = await query(primarySql, whereClauses);

    return NextResponse.json({
      drilling: drillingResult.rows,
      field: fieldResult.rows,
      washing: washingResult.rows,
      assay: assayResult.rows,
      primary: primaryResult.rows,
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
      const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';
      result = await query(
        `UPDATE drilling_records SET
          site = $1, date = $2, hole_number = $3,
          diameter = $4, start_time = $5, end_time = $6,
          queue = $7, is_drilled = $8, project_coordinates = $9,
          true_coordinates = $10, brigade = $11
         WHERE id = $12`,
        [
          record.site,
          record.date,
          record.hole_number,
          parseFloat(record.diameter) || 0,
          record.start_time,
          record.end_time,
          record.queue ? parseInt(record.queue) : null,
          toBool(record.is_drilled),
          record.project_coordinates || '',
          record.true_coordinates || '',
          record.brigade || null,
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
          volume = $4, visual_description = $5, site = $6
         WHERE id = $7`,
        [
          record.hole_number,
          record.interval,
          parseFloat(record.mass) || 0,
          parseFloat(record.volume) || 0,
          record.visual_description || '',
          record.site || null,
          record.id,
        ]
      );
    } else if (type === 'assay') {
      result = await query(
        `UPDATE assay_data SET
          hole_number = $1, interval = $2, reserves = $3,
          marks = $4, sample_weight = $5, site = $6
         WHERE id = $7`,
        [
          record.hole_number,
          record.interval,
          parseFloat(record.reserves) || 0,
          record.marks || '',
          parseFloat(record.sample_weight) || 0,
          record.site || null,
          record.id,
        ]
      );
    } else if (type === 'primary') {
      result = await query(
        `UPDATE primary_survey_data SET
          hole_number = $1, work_area = $2, line_name = $3,
          latitude = $4, longitude = $5, elevation = $6,
          diameter = $7, intervals = $8
         WHERE id = $9`,
        [
          record.hole_number,
          record.work_area,
          record.line_name || '',
          parseFloat(record.latitude) || 0,
          parseFloat(record.longitude) || 0,
          parseFloat(record.elevation) || 0,
          parseFloat(record.diameter) || 0,
          record.intervals || '',
          record.id,
        ]
      );
    } else {
      return NextResponse.json({ error: 'Неизвестный тип данных' }, { status: 400 });
    }

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    await logAudit({
      userId: access.userId,
      username: access.username,
      action: 'update',
      entity: type,
      entityId: record.id,
      details: record.hole_number || '',
    });

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
      primary: 'primary_survey_data',
    };

    const tableName = tables[type];
    if (!tableName) {
      return NextResponse.json({ error: 'Неизвестный тип данных' }, { status: 400 });
    }

    const result = await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    await logAudit({
      userId: access.userId,
      username: access.username,
      action: 'delete',
      entity: type,
      entityId: id,
      details: '',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}