import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    // Получаем точки из drilling_records (с новыми полями)
    const drillingResult = await query(`
      SELECT 
        id,
        site as name,
        hole_number,
        coordinates,
        project_coordinates,
        true_coordinates,
        queue,
        is_drilled,
        date,
        'drilling' as type,
        'Скважина' as layer
      FROM drilling_records
      WHERE coordinates IS NOT NULL AND coordinates != ''
         OR project_coordinates IS NOT NULL AND project_coordinates != ''
         OR true_coordinates IS NOT NULL AND true_coordinates != ''
    `);

    // Получаем точки из field_data
    const fieldResult = await query(`
      SELECT 
        id,
        site as name,
        hole_number,
        coordinates,
        date,
        'field' as type,
        'Участок' as layer
      FROM field_data
      WHERE coordinates IS NOT NULL AND coordinates != ''
    `);

    const allPoints = [...drillingResult.rows, ...fieldResult.rows];
    return NextResponse.json(allPoints);
  } catch (error) {
    console.error('Ошибка загрузки точек карты:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== ДОБАВЛЕНИЕ ТОЧКИ ==========
export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const {
      name,
      coordinates,
      type,
      layer,
      holeNumber,
      date,
      queue,
      isDrilled,
      projectCoordinates,
      trueCoordinates,
    } = await request.json();

    // Для скважины координаты могут прийти как проектные/истинные
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
        [id, name, mainCoords, holeNumber || '', date || '', sessionId, created_at]
      );
    } else {
      await query(
        `INSERT INTO drilling_records 
          (id, site, coordinates, project_coordinates, true_coordinates, queue, is_drilled, hole_number, date, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          name,
          mainCoords,
          projectCoordinates || '',
          trueCoordinates || '',
          queue ? parseInt(queue) : null,
          isDrilled === true || isDrilled === 'true',
          holeNumber || '',
          date || '',
          sessionId,
          created_at,
        ]
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Ошибка добавления точки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}