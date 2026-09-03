import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function POST(request) {
  try {
    const { key } = await request.json();
    if (key !== 'gold-seed-2026') {
      return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
    }

    // Sites
    const sites = [
      ['site_abz', 'АБЗАКОВО'],
      ['site_bel', 'БЕЛОРЕЦК'],
      ['site_ish', 'ИШЛЫ'],
    ];
    for (const [id, name] of sites) {
      await query("INSERT INTO sites (id, name, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [id, name, new Date().toISOString()]);
    }

    // User-site assignments
    const users = await query('SELECT id, role FROM users');
    for (const u of users.rows) {
      const uid = String(u.id);
      if (u.role === 'admin' || u.role === 'chief_geologist') {
        try { await query("INSERT INTO user_sites (id, user_id, site_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", ['su_' + uid + '_a', uid, 'АБЗАКОВО']); } catch {}
        try { await query("INSERT INTO user_sites (id, user_id, site_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", ['su_' + uid + '_b', uid, 'БЕЛОРЕЦК']); } catch {}
      } else {
        try { await query("INSERT INTO user_sites (id, user_id, site_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", ['su_' + uid + '_a', uid, 'АБЗАКОВО']); } catch {}
      }
    }

    // Primary data
    const primary = [
      ['sp1', '1', 'СКВ-001', 'АБЗАКОВО', 'Линия-1', 54.7421, 55.9634, 320, 168, '0-10, 10-25, 25-50'],
      ['sp2', '1', 'СКВ-002', 'АБЗАКОВО', 'Линия-1', 54.7445, 55.9678, 335, 168, '0-15, 15-30, 30-60'],
      ['sp3', '1', 'СКВ-003', 'АБЗАКОВО', 'Линия-2', 54.7512, 55.9701, 310, 146, '0-12, 12-28, 28-55'],
      ['sp4', '1', 'СКВ-004', 'АБЗАКОВО', 'Линия-2', 54.7534, 55.9745, 345, 146, '0-8, 8-20, 20-45'],
      ['sp5', '1', 'СКВ-005', 'АБЗАКОВО', 'Линия-3', 54.7600, 55.9812, 298, 127, '0-10, 10-22, 22-40'],
    ];
    for (const [id, uid, hole, area, line, lat, lon, elev, diam, iv] of primary) {
      await query("INSERT INTO primary_survey_data (id, user_id, hole_number, work_area, line_name, latitude, longitude, elevation, diameter, intervals, coord_system, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING",
        [id, uid, hole, area, line, lat, lon, elev, diam, iv, 'WGS-84', '2026-08-01T10:00:00Z']);
    }

    // Drilling
    const drilling = [
      ['sd1', '2', 'СКВ-001', 'АБЗАКОВО', 1, true, 168, '2026-08-15 07:00', '2026-08-16 18:30', '2026-08-15', 'Бригада-1', '54.7421, 55.9634'],
      ['sd2', '2', 'СКВ-002', 'АБЗАКОВО', 2, true, 168, '2026-08-17 06:30', '2026-08-18 20:00', '2026-08-17', 'Бригада-2', '54.7445, 55.9678'],
      ['sd3', '2', 'СКВ-003', 'АБЗАКОВО', 3, true, 146, '2026-08-19 08:00', '2026-08-20 16:45', '2026-08-19', 'Бригада-1', '54.7512, 55.9701'],
      ['sd4', '2', 'СКВ-004', 'АБЗАКОВО', 4, false, 146, '', '', '2026-08-25', 'Бригада-3', '54.7534, 55.9745'],
      ['sd5', '2', 'СКВ-005', 'АБЗАКОВО', 5, false, 127, '', '', '2026-08-26', 'Бригада-2', '54.7600, 55.9812'],
    ];
    for (const [id, uid, hole, site, q, drilled, diam, start, end, date, brig, coords] of drilling) {
      await query("INSERT INTO drilling_records (id, user_id, hole_number, site, queue, is_drilled, diameter, start_time, end_time, date, brigade, coordinates, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING",
        [id, uid, hole, site, q, drilled, diam, start, end, date, brig, coords, '2026-08-15T07:00:00Z']);
    }

    // Field data
    const field = [
      ['sf1', '3', 'СКВ-001', '54.7421, 55.9634', 320, '0-10', 'Глинистый сланец, серый, плотный', 15.2, 168, 85, '2026-08-20', '09:30', 'Бригада-1'],
      ['sf2', '3', 'СКВ-001', '54.7421, 55.9634', 320, '10-25', 'Песчаник, жёлтый, средней плотности', 22.5, 168, 78, '2026-08-20', '14:15', 'Бригада-1'],
      ['sf3', '3', 'СКВ-002', '54.7445, 55.9678', 335, '0-15', 'Суглинок, бурый, пластичный', 12.0, 168, 90, '2026-08-21', '08:00', 'Бригада-2'],
      ['sf4', '3', 'СКВ-003', '54.7512, 55.9701', 310, '0-12', 'Кварцевый песчаник, белый', 18.3, 146, 72, '2026-08-22', '10:45', 'Бригада-1'],
      ['sf5', '3', 'СКВ-004', '54.7534, 55.9745', 345, '0-8', 'Аргиллит, тёмно-серый, с пиритом', 25.1, 146, 65, '2026-08-23', '11:20', 'Бригада-3'],
      ['sf6', '3', 'СКВ-005', '54.7600, 55.9812', 298, '0-10', 'Конгломерат, галечник', 30.5, 127, 55, '2026-08-24', '09:00', 'Бригада-2'],
    ];
    for (const [id, uid, hole, coords, lh, iv, geo, ugv, diam, core, date, time, brig] of field) {
      await query("INSERT INTO field_data (id, user_id, hole_number, coordinates, line_height, intervals, geological_description, ugv, diameter, core_recovery, date, time, brigade, site, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT DO NOTHING",
        [id, uid, hole, coords, lh, iv, geo, ugv, diam, core, date, time, brig, 'АБЗАКОВО', '2026-08-20T09:00:00Z']);
    }

    // Washing
    const washing = [
      ['sw1', '4', 'СКВ-001', '0-10', 125.5, 48.2, 'Песок серый, водонасыщенный'],
      ['sw2', '4', 'СКВ-001', '10-25', 210.3, 76.8, 'Песчаник с кварцевой жилой'],
      ['sw3', '4', 'СКВ-002', '0-15', 180.0, 65.4, 'Суглинок бурый, пластичный'],
      ['sw4', '4', 'СКВ-003', '0-12', 95.2, 38.7, 'Кварцевый песчаник, белая крошка'],
      ['sw5', '4', 'СКВ-004', '0-8', 67.8, 28.1, 'Аргиллит, тёмный, плотный'],
      ['sw6', '4', 'СКВ-005', '0-10', 142.0, 55.3, 'Песчаник бурый, средней крупности'],
    ];
    for (const [id, uid, hole, iv, mass, vol, vis] of washing) {
      await query("INSERT INTO washing_data (id, user_id, hole_number, interval, mass, volume, visual_description, site, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
        [id, uid, hole, iv, mass, vol, vis, 'АБЗАКОВО', '2026-08-21T09:00:00Z']);
    }

    // Assay
    const assay = [
      ['sa1', '5', 'СКВ-001', '0-10', 2.45, 'Au 1.2 г/т, Ag 15.3 г/т, Cu 0.3%', 5.0],
      ['sa2', '5', 'СКВ-001', '10-25', 5.80, 'Au 2.8 г/т, Ag 22.1 г/т, Cu 0.5%', 8.5],
      ['sa3', '5', 'СКВ-002', '0-15', 3.20, 'Au 1.5 г/т, Ag 18.7 г/т', 6.2],
      ['sa4', '5', 'СКВ-003', '0-12', 1.90, 'Au 0.9 г/т, Ag 12.4 г/т, Pb 0.2%', 4.8],
      ['sa5', '5', 'СКВ-005', '0-10', 4.15, 'Au 2.1 г/т, Ag 20.5 г/т, Zn 0.4%', 7.0],
    ];
    for (const [id, uid, hole, iv, res, marks, wt] of assay) {
      await query("INSERT INTO assay_data (id, user_id, hole_number, interval, reserves, marks, sample_weight, site, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
        [id, uid, hole, iv, res, marks, wt, 'АБЗАКОВО', '2026-08-25T10:00:00Z']);
    }

    return NextResponse.json({ success: true, message: 'Seed complete: 5 primary, 5 drilling, 6 field, 6 washing, 5 assay, 3 sites' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
