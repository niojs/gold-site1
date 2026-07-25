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

  if (!['admin', 'field_geologist', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const drillingTotal = await query('SELECT COUNT(*) as count FROM drilling_records');
    const fieldTotal = await query('SELECT COUNT(*) as count FROM field_data');
    const washingTotal = await query('SELECT COUNT(*) as count FROM washing_data');
    const total = (drillingTotal.rows[0]?.count || 0) + (fieldTotal.rows[0]?.count || 0) + (washingTotal.rows[0]?.count || 0);

    const active = await query(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM drilling_records WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT id FROM field_data WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT id FROM washing_data WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      )
    `);

    const avgGrade = await query('SELECT AVG(CAST(ugv AS REAL)) as avg FROM field_data WHERE ugv IS NOT NULL');

    const monthly = await query(`
      SELECT 
        TO_CHAR(created_at, 'MM') as month,
        COUNT(*) as count
      FROM (
        SELECT created_at FROM drilling_records
        UNION ALL
        SELECT created_at FROM field_data
        UNION ALL
        SELECT created_at FROM washing_data
      )
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'MM')
      ORDER BY month
    `);

    const monthlyData = monthly.rows.map((row) => ({
      month: row.month,
      count: parseInt(row.count, 10),
    }));

    return NextResponse.json({
      total,
      active: active.rows[0]?.count || 0,
      avgGrade: avgGrade.rows[0]?.avg || 0,
      monthlyData,
    });
  } catch (error) {
    console.error('Ошибка статистики:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}