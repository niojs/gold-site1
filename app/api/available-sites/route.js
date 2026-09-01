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

  let sites = [];

  if (user.role === 'admin' || user.role === 'chief_geologist') {
    const managedSites = await query(`SELECT name FROM sites ORDER BY name`);
    sites = managedSites.rows.map(r => r.name);

    if (sites.length === 0) {
      const result = await query(
        `SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL AND work_area != ''`
      );
      sites = result.rows.map(r => r.work_area);
    }

    if (sites.length === 0) {
      const drillingSites = await query(
        `SELECT DISTINCT site FROM drilling_records WHERE site IS NOT NULL AND site != ''`
      );
      sites = drillingSites.rows.map(r => r.site);
    }

    if (sites.length === 0) {
      const userSiteResult = await query(
        `SELECT DISTINCT site_name FROM user_sites WHERE site_name IS NOT NULL AND site_name != ''`
      );
      sites = userSiteResult.rows.map(r => r.site_name);
    }
  } else {
    const assignedResult = await query(
      `SELECT site_name FROM user_sites WHERE user_id = $1`,
      [sessionId]
    );
    sites = assignedResult.rows.map(r => r.site_name);

    if (sites.length === 0) {
      const managedSites = await query(`SELECT name FROM sites ORDER BY name`);
      sites = managedSites.rows.map(r => r.name);
    }

    if (sites.length === 0) {
      const allSites = await query(
        `SELECT DISTINCT work_area FROM primary_survey_data WHERE work_area IS NOT NULL AND work_area != ''`
      );
      sites = allSites.rows.map(r => r.work_area);

      if (sites.length === 0) {
        const drillingSites = await query(
          `SELECT DISTINCT site FROM drilling_records WHERE site IS NOT NULL AND site != ''`
        );
        sites = drillingSites.rows.map(r => r.site);
      }
    }
  }

  return NextResponse.json({ sites: [...new Set(sites)] });
}
