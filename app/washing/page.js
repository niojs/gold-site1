'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GoldGrid from '../components/GoldGrid';

function getSelectedSite() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/selected_site=([^;]+)/);
  const val = match ? decodeURIComponent(match[1]) : null;
  return val === '__none__' ? null : val;
}

export default function WashingPage() {
  const [records, setRecords] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableHoles, setAvailableHoles] = useState([]);
  const [intervalsByHole, setIntervalsByHole] = useState({});
  const router = useRouter();

  useEffect(() => {
    const site = getSelectedSite();
    if (!site) { router.push('/select-site'); return; }
    setSelectedSite(site);
  }, []);

  useEffect(() => {
    if (!selectedSite) return;
    fetch(`/api/holes?site=${encodeURIComponent(selectedSite)}`)
      .then(r => r.json())
      .then(data => {
        setAvailableHoles(data.holes || []);
        setIntervalsByHole(data.intervalsByHole || {});
      })
      .catch(() => {});
  }, [selectedSite]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/washing', { credentials: 'include' });
      if (!res.ok) { if (res.status === 401) router.push('/'); return; }
      const data = await res.json();
      const site = getSelectedSite();
      const filtered = site ? data.filter(r => (r.site || '') === site) : data;
      setRecords(filtered);
    } catch (err) { console.error(err); }
  }, [router]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const columnDefs = [
    { headerName: 'Номер скважины', field: 'holeNumber', editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: availableHoles }, minWidth: 140 },
    { headerName: 'Интервал', field: 'interval', editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: Object.values(intervalsByHole).flat() } },
    { headerName: 'Масса (кг)', field: 'mass', editable: true, type: 'numericColumn' },
    { headerName: 'Объём (л)', field: 'volume', editable: true, type: 'numericColumn' },
    { headerName: 'Плотность (кг/л)', field: 'density', editable: false, type: 'numericColumn',
      valueGetter: (params) => {
        const m = parseFloat(params.data.mass);
        const v = parseFloat(params.data.volume);
        if (m && v && v > 0) return (m / v).toFixed(3);
        return '';
      },
    },
    { headerName: 'Визуально', field: 'visualDescription', editable: true },
    { headerName: 'Записал', field: 'creatorName', editable: false },
  ];

  const rowData = records.map(r => ({
    id: r.id,
    holeNumber: r.hole_number || '',
    interval: r.interval || '',
    mass: r.mass ?? '',
    volume: r.volume ?? '',
    visualDescription: r.visual_description || '',
    creatorName: r.creator_name || '',
    site: r.site || '',
  }));

  const onCellValueChanged = useCallback(async (e) => {
    const row = e.data;
    if (String(row.id).startsWith('new_')) {
      try {
        const res = await fetch('/api/washing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holeNumber: row.holeNumber,
            interval: row.interval,
            mass: row.mass === '' ? null : Number(row.mass),
            volume: row.volume === '' ? null : Number(row.volume),
            visualDescription: row.visualDescription,
            site: selectedSite,
          }),
        });
        if (!res.ok) { const data = await res.json(); setError(data.error || 'Ошибка'); return; }
        showSuccess('Запись добавлена');
        fetchRecords();
      } catch { setError('Ошибка соединения'); }
    } else {
      try {
        const res = await fetch('/api/washing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: row.id,
            holeNumber: row.holeNumber,
            interval: row.interval,
            mass: row.mass === '' ? null : Number(row.mass),
            volume: row.volume === '' ? null : Number(row.volume),
            visualDescription: row.visualDescription,
            site: selectedSite,
          }),
        });
        if (!res.ok) { const data = await res.json(); setError(data.error || 'Ошибка'); return; }
        showSuccess('Запись обновлена');
      } catch { setError('Ошибка соединения'); }
    }
  }, [selectedSite, fetchRecords]);

  const onSave = useCallback(async () => {
    let saved = 0;
    for (const row of records) {
      const isNew = String(row.id).startsWith('temp-') || String(row.id).startsWith('new_');
      try {
        if (isNew) {
          const res = await fetch('/api/washing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              holeNumber: row.holeNumber,
              interval: row.interval,
              mass: row.mass === '' ? null : Number(row.mass),
              volume: row.volume === '' ? null : Number(row.volume),
              visualDescription: row.visualDescription,
              site: selectedSite,
            }),
          });
          if (res.ok) saved++;
        } else {
          const res = await fetch('/api/washing', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              id: row.id,
              holeNumber: row.holeNumber,
              interval: row.interval,
              mass: row.mass === '' ? null : Number(row.mass),
              volume: row.volume === '' ? null : Number(row.volume),
              visualDescription: row.visualDescription,
              site: selectedSite,
            }),
          });
          if (res.ok) saved++;
        }
      } catch (e) { console.error(e); }
    }
    if (saved > 0) { showSuccess(`Сохранено: ${saved}`); fetchRecords(); }
  }, [records, selectedSite, fetchRecords]);

  const onAddRow = useCallback(() => {
    setRecords(prev => [
      { id: 'new_' + Date.now(), holeNumber: '', interval: '', mass: '', volume: '', visualDescription: '', site: getSelectedSite(), creatorName: '' },
      ...prev,
    ]);
  }, [selectedSite]);

  const onDeleteRows = useCallback(async (rows) => {
    const ids = rows.map(r => r.id).filter(id => !String(id).startsWith('new_'));
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/washing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: ids.length === 1 ? ids[0] : ids }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Ошибка'); return; }
      showSuccess('Записи удалены');
      fetchRecords();
    } catch { setError('Ошибка соединения'); }
  }, [fetchRecords]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
        <h1 style={{ color: '#e0dcc8', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Отдел промывки</h1>
        {selectedSite && (
          <span style={{
            background: 'rgba(212,175,55,0.15)', color: '#d4af37',
            fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: 20,
          }}>{selectedSite}</span>
        )}
      </div>

      {error && (
        <div style={{
          background: 'rgba(207,107,94,0.1)', border: '1px solid rgba(207,107,94,0.4)',
          color: '#cf6b5e', padding: '0.8rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem',
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.4)',
          color: '#2ecc71', padding: '0.8rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem',
        }}>{success}</div>
      )}

      <GoldGrid
        columnDefs={columnDefs}
        rowData={rowData}
        onCellValueChanged={onCellValueChanged}
        onDeleteRows={onDeleteRows}
        onAddRow={onAddRow}
        addRowLabel="+ Добавить строку"
        getRowId={params => params.data.id}
        onSave={onSave}
        saveLabel="Сохранить"
        height="65vh"
      />
    </div>
  );
}
