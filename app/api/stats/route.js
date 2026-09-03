import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const [
      primaryRes,
      drillingRes,
      fieldRes,
      washingRes,
      assayRes,
      sitesRes,
      usersRes,
    ] = await Promise.all([
      query('SELECT COUNT(*) as total, work_area FROM primary_survey_data GROUP BY work_area'),
      query('SELECT COUNT(*) as total, site, is_drilled FROM drilling_records GROUP BY site, is_drilled'),
      query('SELECT COUNT(*) as total, site FROM field_data GROUP BY site'),
      query('SELECT COUNT(*) as total, site, SUM(mass) as total_mass, SUM(volume) as total_volume FROM washing_data GROUP BY site'),
      query('SELECT COUNT(*) as total, site, AVG(reserves) as avg_reserves, MAX(reserves) as max_reserves, SUM(sample_weight) as total_weight FROM assay_data GROUP BY site'),
      query('SELECT COUNT(*) as total FROM sites'),
      query('SELECT role, COUNT(*) as total FROM users GROUP BY role'),
    ]);

    const primary = primaryRes.rows;
    const drilling = drillingRes.rows;
    const field = fieldRes.rows;
    const washing = washingRes.rows;
    const assay = assayRes.rows;
    const sites = Number(sitesRes.rows[0]?.total) || 0;
    const users = usersRes.rows;

    // Drilling stats per site
    const drillingBySite = {};
    for (const row of drilling) {
      if (!drillingBySite[row.site]) drillingBySite[row.site] = { total: 0, drilled: 0, planned: 0 };
      drillingBySite[row.site].total += Number(row.total);
      if (row.is_drilled === true || row.is_drilled === 1) drillingBySite[row.site].drilled += Number(row.total);
      else drillingBySite[row.site].planned += Number(row.total);
    }

    // Primary data per site
    const primaryBySite = {};
    for (const row of primary) {
      primaryBySite[row.work_area] = Number(row.total);
    }

    // Washing stats
    const washingBySite = {};
    for (const row of washing) {
      washingBySite[row.site] = { count: Number(row.total), mass: parseFloat(row.total_mass) || 0, volume: parseFloat(row.total_volume) || 0 };
    }

    // Assay stats
    const assayBySite = {};
    for (const row of assay) {
      assayBySite[row.site] = {
        count: Number(row.total),
        avgReserves: parseFloat(row.avg_reserves) || 0,
        maxReserves: parseFloat(row.max_reserves) || 0,
        totalWeight: parseFloat(row.total_weight) || 0,
      };
    }

    // Users by role
    const usersByRole = {};
    for (const row of users) {
      usersByRole[row.role] = Number(row.total);
    }

    // Totals - ensure all are numbers (BigInt fix for PostgreSQL)
    const totalPrimary = primary.reduce((s, r) => s + Number(r.total), 0);
    const totalDrilling = drilling.reduce((s, r) => s + Number(r.total), 0);
    const totalDrilled = drilling.filter(r => r.is_drilled === true || r.is_drilled === 1).reduce((s, r) => s + Number(r.total), 0);
    const totalField = field.reduce((s, r) => s + Number(r.total), 0);
    const totalWashing = washing.reduce((s, r) => s + Number(r.total), 0);
    const totalAssay = assay.reduce((s, r) => s + Number(r.total), 0);

    return NextResponse.json({
      totals: {
        primary: totalPrimary,
        drilling: totalDrilling,
        drilled: totalDrilled,
        planned: totalDrilling - totalDrilled,
        field: totalField,
        washing: totalWashing,
        assay: totalAssay,
        sites,
      },
      primaryBySite,
      drillingBySite,
      washingBySite,
      assayBySite,
      usersByRole,
    });
  } catch (error) {
    console.error('Ошибка статистики:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
