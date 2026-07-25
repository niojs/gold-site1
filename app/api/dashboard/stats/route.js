import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  // Проверяем роль
  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  const role = user?.role;

  if (!['admin', 'field_geologist', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    // Подсчёт записей
    const drillingTotal = db.prepare('SELECT COUNT(*) as count FROM drilling_records').get();
    const fieldTotal = db.prepare('SELECT COUNT(*) as count FROM field_data').get();
    const washingTotal = db.prepare('SELECT COUNT(*) as count FROM washing_data').get();
    const total = (drillingTotal?.count || 0) + (fieldTotal?.count || 0) + (washingTotal?.count || 0);

    // Активные за 30 дней
    const active = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM drilling_records WHERE date >= date('now', '-30 days')
        UNION ALL
        SELECT id FROM field_data WHERE date >= date('now', '-30 days')
        UNION ALL
        SELECT id FROM washing_data WHERE created_at >= date('now', '-30 days')
      )
    `).get();

    // Средняя проба
    const avgGrade = db.prepare('SELECT AVG(CAST(ugv AS REAL)) as avg FROM field_data WHERE ugv IS NOT NULL').get();

    // Данные для графика
    const monthly = db.prepare(`
      SELECT 
        strftime('%m', created_at) as month,
        COUNT(*) as count
      FROM (
        SELECT created_at FROM drilling_records
        UNION ALL
        SELECT created_at FROM field_data
        UNION ALL
        SELECT created_at FROM washing_data
      )
      WHERE created_at >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month
    `).all();

    const monthlyData = monthly.map((row) => ({
      month: row.month,
      count: row.count,
    }));

    return NextResponse.json({
      total,
      active: active?.count || 0,
      avgGrade: avgGrade?.avg || 0,
      monthlyData,
    });
  } catch (error) {
    console.error('Ошибка статистики:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}