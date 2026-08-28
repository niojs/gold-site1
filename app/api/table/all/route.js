import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  const role = user?.role;

  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
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