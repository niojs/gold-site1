import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const userResult = await query('SELECT id FROM users WHERE id = $1', [sessionId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site');

    if (!site) {
      return NextResponse.json({ holes: [], intervals: [] });
    }

    const result = await query(
      'SELECT DISTINCT hole_number, intervals FROM primary_survey_data WHERE work_area = $1 ORDER BY hole_number',
      [site]
    );

    const holes = result.rows.map(r => r.hole_number);

    const intervalsByHole = {};
    for (const row of result.rows) {
      if (row.intervals) {
        const parts = row.intervals.split(',').map(s => s.trim()).filter(Boolean);
        intervalsByHole[row.hole_number] = [...new Set([...(intervalsByHole[row.hole_number] || []), ...parts])];
      }
    }

    return NextResponse.json({ holes, intervalsByHole });
  } catch (error) {
    console.error('Ошибка загрузки скважин:', error);
    return NextResponse.json({ holes: [], intervalsByHole: {} });
  }
}
