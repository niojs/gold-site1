import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  const role = user?.role;

  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const drilling = db.prepare('SELECT * FROM drilling_records ORDER BY created_at DESC').all();
    const field = db.prepare('SELECT * FROM field_data ORDER BY created_at DESC').all();
    const washing = db.prepare('SELECT * FROM washing_data ORDER BY created_at DESC').all();
    const assay = db.prepare('SELECT * FROM assay_data ORDER BY created_at DESC').all();

    return NextResponse.json({
      drilling,
      field,
      washing,
      assay,
    });
  } catch (error) {
    console.error('Ошибка загрузки всех данных:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}