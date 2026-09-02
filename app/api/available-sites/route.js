import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = userResult.rows[0];
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const siteSet = new Set();

  async function addFromQuery(sql, field) {
    try {
      const result = await query(sql);
      for (const r of result.rows) {
        const val = r[field];
        if (val && val.trim()) siteSet.add(val.trim());
      }
    } catch (e) { /* table/column may not exist */ }
  }

  if (user.role === 'admin' || user.role === 'chief_geologist') {
    await addFromQuery('SELECT name FROM sites ORDER BY name', 'name');
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL AND work_area != ''`, 'work_area');
    }
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT site FROM drilling_records WHERE site IS NOT NULL AND site != ''`, 'site');
    }
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT site FROM field_data WHERE site IS NOT NULL AND site != ''`, 'site');
    }
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT site_name FROM user_sites WHERE site_name IS NOT NULL AND site_name != ''`, 'site_name');
    }
  } else {
    await addFromQuery(
      `SELECT site_name FROM user_sites WHERE user_id = $1`,
      'site_name'
    );

    if (siteSet.size === 0) {
      await addFromQuery('SELECT name FROM sites ORDER BY name', 'name');
    }

    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL AND work_area != ''`, 'work_area');
    }
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT site FROM drilling_records WHERE site IS NOT NULL AND site != ''`, 'site');
    }
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT site FROM field_data WHERE site IS NOT NULL AND site != ''`, 'site');
    }
    if (siteSet.size === 0) {
      await addFromQuery(`SELECT DISTINCT site_name FROM user_sites WHERE site_name IS NOT NULL AND site_name != ''`, 'site_name');
    }
  }

  return NextResponse.json({ sites: [...siteSet].sort() });
}
