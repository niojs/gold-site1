import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';

const CAN_EDIT = ['admin', 'driller', 'chief_geologist', 'field_geologist'];
const CAN_VIEW_MAP = ['admin', 'driller', 'chief_geologist', 'field_geologist'];

async function getCurrentUser(sessionId) {
  if (!sessionId) return null;
  const res = await query('SELECT id, username, role FROM users WHERE id = $1', [sessionId]);
  return res.rows[0] || null;
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  const siteFilter = cookieStore.get('selected_site')?.value;
  const user = await getCurrentUser(sessionId);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_VIEW_MAP.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа к карте' }, { status: 403 });
  }

  const useSiteFilter = siteFilter && siteFilter !== '__none__';

  try {
    let drillingSql = `
      SELECT 
        id, site, site as name, hole_number, coordinates,
        project_coordinates, true_coordinates, queue, is_drilled, date,
        diameter, start_time, end_time, brigade,
        'drilling' as type, 'Скважина' as layer
      FROM drilling_records
      WHERE (coordinates IS NOT NULL AND coordinates != ''
         OR project_coordinates IS NOT NULL AND project_coordinates != ''
         OR true_coordinates IS NOT NULL AND true_coordinates != '')`;
    const drillingParams = [];
    if (useSiteFilter) {
      drillingSql += ` AND site = $1`;
      drillingParams.push(siteFilter);
    }
    const drillingResult = await query(drillingSql, drillingParams);

    let fieldSql = `
      SELECT 
        id, site, site as name, hole_number, coordinates, date,
        'field' as type, 'Участок' as layer
      FROM field_data
      WHERE coordinates IS NOT NULL AND coordinates != ''`;
    const fieldParams = [];
    if (useSiteFilter) {
      fieldSql += ` AND site = $1`;
      fieldParams.push(siteFilter);
    }
    const fieldResult = await query(fieldSql, fieldParams);

    const allPoints = [...drillingResult.rows, ...fieldResult.rows];
    return NextResponse.json({
      points: allPoints,
      currentUser: { id: user.id, role: user.role, canEdit: CAN_EDIT.includes(user.role) },
    });
  } catch (error) {
    console.error('Ошибка загрузки точек карты:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  const user = await getCurrentUser(sessionId);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_VIEW_MAP.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  try {
    const {
      name, coordinates, type, layer, hole_number, holeNumber, date,
      site, diameter, start_time, startTime, end_time, endTime,
      queue, is_drilled, isDrilled, project_coordinates, projectCoordinates,
      true_coordinates, trueCoordinates, brigade,
    } = await request.json();

    const hn = hole_number || holeNumber || '';
    const st = start_time || startTime || '';
    const et = end_time || endTime || '';
    const drilled = is_drilled !== undefined ? (is_drilled === true || is_drilled === 'true') : (isDrilled === true || isDrilled === 'true');
    const pc = project_coordinates || projectCoordinates || '';
    const tc = true_coordinates || trueCoordinates || '';

    const mainCoords = coordinates || trueCoordinates || projectCoordinates || '';
    if (!name || !mainCoords) {
      return NextResponse.json({ error: 'Название и координаты обязательны' }, { status: 400 });
    }

    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    if (type === 'field') {
      await query(
        `INSERT INTO field_data (id, site, coordinates, hole_number, date, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, name, mainCoords, hn, date || '', user.id, created_at]
      );
    } else {
      await query(
        `INSERT INTO drilling_records 
          (id, site, coordinates, project_coordinates, true_coordinates, queue, is_drilled, hole_number, date, diameter, start_time, end_time, user_id, created_at, created_by, brigade)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id, site || name, mainCoords, pc, tc,
          queue ? parseInt(queue) : null,
          drilled, hn, date || '',
          diameter ? parseFloat(diameter) : null,
          st, et,
          user.id, created_at, user.id, brigade || null,
        ]
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Ошибка добавления точки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  const user = await getCurrentUser(sessionId);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_EDIT.includes(user.role)) {
    return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 });
  }

  try {
    const {
      id, type, name, hole_number, queue, is_drilled,
      project_coordinates, true_coordinates,
      site, diameter, start_time, end_time, brigade,
    } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });

    if (type === 'drilling') {
      const mainCoords = true_coordinates || project_coordinates || '';
      await query(
        `UPDATE drilling_records
         SET site = $1, hole_number = $2, queue = $3, is_drilled = $4,
             project_coordinates = $5, true_coordinates = $6, coordinates = $7,
             diameter = $8, start_time = $9, end_time = $10, brigade = $11
         WHERE id = $12`,
        [
          site || name, hole_number || '',
          queue ? parseInt(queue) : null,
          is_drilled === true || is_drilled === 'true',
          project_coordinates || '', true_coordinates || '', mainCoords,
          diameter ? parseFloat(diameter) : null,
          start_time || '', end_time || '',
          brigade || null, id,
        ]
      );
    } else {
      await query(`UPDATE field_data SET site = $1, hole_number = $2, coordinates = $3 WHERE id = $4`, [
        name, hole_number || '', true_coordinates || project_coordinates || '', id,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка редактирования:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  const user = await getCurrentUser(sessionId);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_EDIT.includes(user.role)) {
    return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
  }

  try {
    const { id, type } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });

    let result;
    if (type === 'drilling') {
      result = await query('DELETE FROM drilling_records WHERE id = $1', [id]);
    } else {
      result = await query('DELETE FROM field_data WHERE id = $1', [id]);
    }

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}