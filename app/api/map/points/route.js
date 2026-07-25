import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  // Получаем точки из разных таблиц
  const drillingPoints = db.prepare(`
    SELECT 
      id,
      site as name,
      hole_number,
      coordinates,
      date,
      'drilling' as type,
      'Скважина' as layer
    FROM drilling_records
    WHERE coordinates IS NOT NULL AND coordinates != ''
  `).all();

  const fieldPoints = db.prepare(`
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
  `).all();

  // Объединяем
  const allPoints = [...drillingPoints, ...fieldPoints];

  return NextResponse.json(allPoints);
}

// ========== ДОБАВЛЕНИЕ ТОЧКИ ==========
export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { name, coordinates, type, layer, holeNumber, date } = await request.json();

    if (!name || !coordinates) {
      return NextResponse.json({ error: 'Название и координаты обязательны' }, { status: 400 });
    }

    // Определяем таблицу для вставки
    let table = 'drilling_records';
    let fields = 'site, coordinates, hole_number, date, user_id';
    let values = `'${name}', '${coordinates}', '${holeNumber || ''}', '${date || ''}', '${sessionId}'`;

    if (type === 'field') {
      table = 'field_data';
      fields = 'site, coordinates, hole_number, date, user_id';
      values = `'${name}', '${coordinates}', '${holeNumber || ''}', '${date || ''}', '${sessionId}'`;
    }

    const id = Date.now().toString();
    db.prepare(`INSERT INTO ${table} (id, ${fields}) VALUES ('${id}', ${values})`).run();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Ошибка добавления точки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}