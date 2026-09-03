import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
    if (userResult.rows[0]?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { action } = await request.json();

    if (action === 'seed') {
      // Sites
      const sites = ['АБЗАКОВО', 'БЕЛОРЕЦК', 'ИШЛЫ'];
      for (const s of sites) {
        await query("INSERT INTO sites (name) VALUES ($1) ON CONFLICT DO NOTHING", [s]);
      }

      // User-site assignments
      const users = await query('SELECT id, role FROM users');
      for (const u of users.rows) {
        if (u.role === 'admin' || u.role === 'chief_geologist') {
          try { await query("INSERT INTO user_sites (id, user_id, site_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", ['us_' + u.id + '_abz', u.id, 'АБЗАКОВО']); } catch {}
          try { await query("INSERT INTO user_sites (id, user_id, site_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", ['us_' + u.id + '_bel', u.id, 'БЕЛОРЕЦК']); } catch {}
        } else {
          try { await query("INSERT INTO user_sites (id, user_id, site_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", ['us_' + u.id + '_abz', u.id, 'АБЗАКОВО']); } catch {}
        }
      }

      // Primary data
      const primary = [
        ['sp1', 'СКВ-001', 'АБЗАКОВО', 'Линия-1', 54.7421, 55.9634, 320, 168, '0-10, 10-25, 25-50'],
        ['sp2', 'СКВ-002', 'АБЗАКОВО', 'Линия-1', 54.7445, 55.9678, 335, 168, '0-15, 15-30, 30-60'],
        ['sp3', 'СКВ-003', 'АБЗАКОВО', 'Линия-2', 54.7512, 55.9701, 310, 146, '0-12, 12-28, 28-55'],
        ['sp4', 'СКВ-004', 'АБЗАКОВО', 'Линия-2', 54.7534, 55.9745, 345, 146, '0-8, 8-20, 20-45'],
        ['sp5', 'СКВ-005', 'АБЗАКОВО', 'Линия-3', 54.7600, 55.9812, 298, 127, '0-10, 10-22, 22-40'],
      ];
      for (const [id, hole, area, line, lat, lon, elev, diam, iv] of primary) {
        try {
          await query("INSERT INTO primary_survey_data (id, user_id, hole_number, work_area, line_name, latitude, longitude, elevation, diameter, intervals, coord_system, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING",
            [id, '1', hole, area, line, lat, lon, elev, diam, iv, 'WGS-84', new Date().toISOString()]);
        } catch {}
      }

      // Drilling
      const drilling = [
        ['sd1', 'СКВ-001', 'АБЗАКОВО', 1, true, 168, '2026-08-15 07:00', '2026-08-16 18:30', '2026-08-15', 'Бригада-1', '54.7421, 55.9634'],
        ['sd2', 'СКВ-002', 'АБЗАКОВО', 2, true, 168, '2026-08-17 06:30', '2026-08-18 20:00', '2026-08-17', 'Бригада-2', '54.7445, 55.9678'],
        ['sd3', 'СКВ-003', 'АБЗАКОВО', 3, true, 146, '2026-08-19 08:00', '2026-08-20 16:45', '2026-08-19', 'Бригада-1', '54.7512, 55.9701'],
        ['sd4', 'СКВ-004', 'АБЗАКОВО', 4, false, 146, '', '', '2026-08-25', 'Бригада-3', '54.7534, 55.9745'],
        ['sd5', 'СКВ-005', 'АБЗАКОВО', 5, false, 127, '', '', '2026-08-26', 'Бригада-2', '54.7600, 55.9812'],
      ];
      for (const [id, hole, site, q, drilled, diam, start, end, date, brig, coords] of drilling) {
        try {
          await query("INSERT INTO drilling_records (id, user_id, hole_number, site, queue, is_drilled, diameter, start_time, end_time, date, brigade, coordinates, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING",
            [id, '2', hole, site, q, drilled, diam, start, end, date, brig, coords, new Date().toISOString()]);
        } catch {}
      }

      // Field data
      const field = [
        ['sf1', 'СКВ-001', '54.7421, 55.9634', 320, '0-10', 'Глинистый сланец, серый, плотный', 15.2, 168, 85, '2026-08-20', '09:30', 'Бригада-1'],
        ['sf2', 'СКВ-001', '54.7421, 55.9634', 320, '10-25', 'Песчаник, жёлтый, средней плотности', 22.5, 168, 78, '2026-08-20', '14:15', 'Бригада-1'],
        ['sf3', 'СКВ-002', '54.7445, 55.9678', 335, '0-15', 'Суглинок, бурый, пластичный', 12.0, 168, 90, '2026-08-21', '08:00', 'Бригада-2'],
        ['sf4', 'СКВ-003', '54.7512, 55.9701', 310, '0-12', 'Кварцевый песчаник, белый', 18.3, 146, 72, '2026-08-22', '10:45', 'Бригада-1'],
        ['sf5', 'СКВ-004', '54.7534, 55.9745', 345, '0-8', 'Аргиллит, тёмно-серый, с пиритом', 25.1, 146, 65, '2026-08-23', '11:20', 'Бригада-3'],
        ['sf6', 'СКВ-005', '54.7600, 55.9812', 298, '0-10', 'Конгломерат, галечник', 30.5, 127, 55, '2026-08-24', '09:00', 'Бригада-2'],
      ];
      for (const [id, hole, coords, lh, iv, geo, ugv, diam, core, date, time, brig] of field) {
        try {
          await query("INSERT INTO field_data (id, user_id, hole_number, coordinates, line_height, intervals, geological_description, ugv, diameter, core_recovery, date, time, brigade, site, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT DO NOTHING",
            [id, '3', hole, coords, lh, iv, geo, ugv, diam, core, date, time, brig, 'АБЗАКОВО', new Date().toISOString()]);
        } catch {}
      }

      // Washing
      const washing = [
        ['sw1', 'СКВ-001', '0-10', 125.5, 48.2, 'Песок серый, водонасыщенный'],
        ['sw2', 'СКВ-001', '10-25', 210.3, 76.8, 'Песчаник с кварцевой жилой'],
        ['sw3', 'СКВ-002', '0-15', 180.0, 65.4, 'Суглинок бурый, пластичный'],
        ['sw4', 'СКВ-003', '0-12', 95.2, 38.7, 'Кварцевый песчаник, белая крошка'],
        ['sw5', 'СКВ-004', '0-8', 67.8, 28.1, 'Аргиллит, тёмный, плотный'],
        ['sw6', 'СКВ-005', '0-10', 142.0, 55.3, 'Песчаник бурый, средней крупности'],
      ];
      for (const [id, hole, iv, mass, vol, vis] of washing) {
        try {
          await query("INSERT INTO washing_data (id, user_id, hole_number, interval, mass, volume, visual_description, site, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
            [id, '4', hole, iv, mass, vol, vis, 'АБЗАКОВО', new Date().toISOString()]);
        } catch {}
      }

      // Assay
      const assay = [
        ['sa1', 'СКВ-001', '0-10', 2.45, 'Au 1.2 г/т, Ag 15.3 г/т, Cu 0.3%', 5.0],
        ['sa2', 'СКВ-001', '10-25', 5.80, 'Au 2.8 г/т, Ag 22.1 г/т, Cu 0.5%', 8.5],
        ['sa3', 'СКВ-002', '0-15', 3.20, 'Au 1.5 г/т, Ag 18.7 г/т', 6.2],
        ['sa4', 'СКВ-003', '0-12', 1.90, 'Au 0.9 г/т, Ag 12.4 г/т, Pb 0.2%', 4.8],
        ['sa5', 'СКВ-005', '0-10', 4.15, 'Au 2.1 г/т, Ag 20.5 г/т, Zn 0.4%', 7.0],
      ];
      for (const [id, hole, iv, res, marks, wt] of assay) {
        try {
          await query("INSERT INTO assay_data (id, user_id, hole_number, interval, reserves, marks, sample_weight, site, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
            [id, '5', hole, iv, res, marks, wt, 'АБЗАКОВО', new Date().toISOString()]);
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Данные засеяны' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
