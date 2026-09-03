// Seed data via API calls
const BASE = 'http://localhost:3000';

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  });
  return res.json();
}

async function seed() {
  console.log('=== Creating primary data ===');
  const primaryData = [
    { workArea: 'АБЗАКОВО', lineName: 'Линия-1', latitude: 54.7421, longitude: 55.9634, elevation: 320, holeNumber: 'СКВ-001', diameter: 168, intervals: '0-10, 10-25, 25-50' },
    { workArea: 'АБЗАКОВО', lineName: 'Линия-1', latitude: 54.7445, longitude: 55.9678, elevation: 335, holeNumber: 'СКВ-002', diameter: 168, intervals: '0-15, 15-30, 30-60' },
    { workArea: 'АБЗАКОВО', lineName: 'Линия-2', latitude: 54.7512, longitude: 55.9701, elevation: 310, holeNumber: 'СКВ-003', diameter: 146, intervals: '0-12, 12-28, 28-55' },
    { workArea: 'АБЗАКОВО', lineName: 'Линия-2', latitude: 54.7534, longitude: 55.9745, elevation: 345, holeNumber: 'СКВ-004', diameter: 146, intervals: '0-8, 8-20, 20-45' },
    { workArea: 'АБЗАКОВО', lineName: 'Линия-3', latitude: 54.7600, longitude: 55.9812, elevation: 298, holeNumber: 'СКВ-005', diameter: 127, intervals: '0-10, 10-22, 22-40' },
  ];
  for (const p of primaryData) {
    const r = await api('/api/primary-data', { method: 'POST', body: JSON.stringify(p) });
    console.log('  Primary:', p.holeNumber, r.success ? 'OK' : r.error);
  }

  console.log('=== Creating drilling records ===');
  const drillingData = [
    { holeNumber: 'СКВ-001', site: 'АБЗАКОВО', queue: 1, isDrilled: true, diameter: 168, startTime: '2026-08-15 07:00', endTime: '2026-08-16 18:30', date: '2026-08-15', brigade: 'Бригада-1', coordinates: '54.7421, 55.9634' },
    { holeNumber: 'СКВ-002', site: 'АБЗАКОВО', queue: 2, isDrilled: true, diameter: 168, startTime: '2026-08-17 06:30', endTime: '2026-08-18 20:00', date: '2026-08-17', brigade: 'Бригада-2', coordinates: '54.7445, 55.9678' },
    { holeNumber: 'СКВ-003', site: 'АБЗАКОВО', queue: 3, isDrilled: true, diameter: 146, startTime: '2026-08-19 08:00', endTime: '2026-08-20 16:45', date: '2026-08-19', brigade: 'Бригада-1', coordinates: '54.7512, 55.9701' },
    { holeNumber: 'СКВ-004', site: 'АБЗАКОВО', queue: 4, isDrilled: false, diameter: 146, startTime: '', endTime: '', date: '2026-08-25', brigade: 'Бригада-3', coordinates: '54.7534, 55.9745' },
    { holeNumber: 'СКВ-005', site: 'АБЗАКОВО', queue: 5, isDrilled: false, diameter: 127, startTime: '', endTime: '', date: '2026-08-26', brigade: 'Бригада-2', coordinates: '54.7600, 55.9812' },
  ];
  for (const d of drillingData) {
    const r = await api('/api/drilling', { method: 'POST', body: JSON.stringify(d) });
    console.log('  Drilling:', d.holeNumber, r.success ? 'OK' : r.error);
  }

  console.log('=== Creating field data ===');
  const fieldData = [
    { holeNumber: 'СКВ-001', coordinates: '54.7421, 55.9634', lineHeight: 320, intervals: '0-10', geologicalDescription: 'Глинистый сланец, серый, плотный', ugv: 15.2, diameter: 168, coreRecovery: 85, date: '2026-08-20', time: '09:30', brigade: 'Бригада-1' },
    { holeNumber: 'СКВ-001', coordinates: '54.7421, 55.9634', lineHeight: 320, intervals: '10-25', geologicalDescription: 'Песчаник, жёлтый, средней плотности', ugv: 22.5, diameter: 168, coreRecovery: 78, date: '2026-08-20', time: '14:15', brigade: 'Бригада-1' },
    { holeNumber: 'СКВ-002', coordinates: '54.7445, 55.9678', lineHeight: 335, intervals: '0-15', geologicalDescription: 'Суглинок, бурый, пластичный', ugv: 12.0, diameter: 168, coreRecovery: 90, date: '2026-08-21', time: '08:00', brigade: 'Бригада-2' },
    { holeNumber: 'СКВ-003', coordinates: '54.7512, 55.9701', lineHeight: 310, intervals: '0-12', geologicalDescription: 'Кварцевый песчаник, белый, средней сцементированности', ugv: 18.3, diameter: 146, coreRecovery: 72, date: '2026-08-22', time: '10:45', brigade: 'Бригада-1' },
    { holeNumber: 'СКВ-004', coordinates: '54.7534, 55.9745', lineHeight: 345, intervals: '0-8', geologicalDescription: 'Аргиллит, тёмно-серый, плотный', ugv: 25.1, diameter: 146, coreRecovery: 65, date: '2026-08-23', time: '11:20', brigade: 'Бригада-3' },
    { holeNumber: 'СКВ-005', coordinates: '54.7600, 55.9812', lineHeight: 298, intervals: '0-10', geologicalDescription: 'Конгломерат, галечник, разнозернистый', ugv: 30.5, diameter: 127, coreRecovery: 55, date: '2026-08-24', time: '09:00', brigade: 'Бригада-2' },
  ];
  for (const f of fieldData) {
    const r = await api('/api/field-data', { method: 'POST', body: JSON.stringify({ ...f, site: 'АБЗАКОВО' }) });
    console.log('  Field:', f.holeNumber, f.intervals, r.success ? 'OK' : r.error);
  }

  console.log('=== Creating washing data ===');
  const washingData = [
    { holeNumber: 'СКВ-001', interval: '0-10', mass: 125.5, volume: 48.2, visualDescription: 'Песок серый, водонасыщенный, с галькой' },
    { holeNumber: 'СКВ-001', interval: '10-25', mass: 210.3, volume: 76.8, visualDescription: 'Песчаник с кварцевой жилой, мелкозернистый' },
    { holeNumber: 'СКВ-002', interval: '0-15', mass: 180.0, volume: 65.4, visualDescription: 'Суглинок бурый, пластичный, с растительными остатками' },
    { holeNumber: 'СКВ-003', interval: '0-12', mass: 95.2, volume: 38.7, visualDescription: 'Кварцевый песчаник, крошка, белая' },
    { holeNumber: 'СКВ-004', interval: '0-8', mass: 67.8, volume: 28.1, visualDescription: 'Аргиллит, тёмный, плотный, с прожилками' },
    { holeNumber: 'СКВ-005', interval: '0-10', mass: 142.0, volume: 55.3, visualDescription: 'Песчаник бурый, средней pudding' },
  ];
  for (const w of washingData) {
    const r = await api('/api/washing', { method: 'POST', body: JSON.stringify({ ...w, site: 'АБЗАКОВО' }) });
    console.log('  Washing:', w.holeNumber, w.interval, r.success ? 'OK' : r.error);
  }

  console.log('=== Creating assay data ===');
  const assayData = [
    { holeNumber: 'СКВ-001', interval: '0-10', reserves: 2.45, marks: 'Au 1.2 г/т, Ag 15.3 г/т, Cu 0.3%', sampleWeight: 5.0 },
    { holeNumber: 'СКВ-001', interval: '10-25', reserves: 5.80, marks: 'Au 2.8 г/т, Ag 22.1 г/т, Cu 0.5%', sampleWeight: 8.5 },
    { holeNumber: 'СКВ-002', interval: '0-15', reserves: 3.20, marks: 'Au 1.5 г/т, Ag 18.7 г/т', sampleWeight: 6.2 },
    { holeNumber: 'СКВ-003', interval: '0-12', reserves: 1.90, marks: 'Au 0.9 г/т, Ag 12.4 г/т, Pb 0.2%', sampleWeight: 4.8 },
    { holeNumber: 'СКВ-005', interval: '0-10', reserves: 4.15, marks: 'Au 2.1 г/т, Ag 20.5 г/т, Zn 0.4%', sampleWeight: 7.0 },
  ];
  for (const a of assayData) {
    const r = await api('/api/assay', { method: 'POST', body: JSON.stringify({ ...a, site: 'АБЗАКОВО' }) });
    console.log('  Assay:', a.holeNumber, a.interval, r.success ? 'OK' : r.error);
  }

  console.log('\n=== SEED COMPLETE ===');
}

seed().catch(e => { console.error(e); process.exit(1); });
