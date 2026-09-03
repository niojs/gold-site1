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

export default function DrillingPage() {
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
      const res = await fetch('/api/drilling', { credentials: 'include' });
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
    { headerName: 'Скважина', field: 'holeNumber', editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: availableHoles }, minWidth: 140 },
    { headerName: 'Участок', field: 'site', editable: false },
    { headerName: 'Очередь', field: 'queue', editable: true, type: 'numericColumn' },
    { headerName: 'Пробурена', field: 'isDrilled', editable: true, cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Да', 'Нет'] },
      valueSetter: (params) => { params.data.isDrilled = params.newValue; return true; },
    },
    { headerName: 'Диаметр', field: 'diameter', editable: true, type: 'numericColumn' },
    { headerName: 'Начало', field: 'startTime', editable: true },
    { headerName: 'Конец', field: 'endTime', editable: true },
    { headerName: 'Дата', field: 'date', editable: true },
    { headerName: 'Бригада', field: 'brigade', editable: true },
    { headerName: 'Координаты', field: 'coordinates', editable: true },
  ];

  const rowData = records.map(r => ({
    id: r.id,
    holeNumber: r.hole_number || '',
    site: r.site || '',
    queue: r.queue ?? '',
    isDrilled: r.is_drilled ? 'Да' : 'Нет',
    diameter: r.diameter ?? '',
    startTime: r.start_time || '',
    endTime: r.end_time || '',
    date: r.date || '',
    brigade: r.brigade || '',
    coordinates: r.coordinates || '',
  }));

  const onCellValueChanged = useCallback(async (e) => {
    const row = e.data;
    if (String(row.id).startsWith('new_')) {
      try {
        const res = await fetch('/api/drilling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holeNumber: row.holeNumber,
            site: selectedSite,
            queue: row.queue === '' ? null : Number(row.queue),
            isDrilled: row.isDrilled === 'Да',
            diameter: row.diameter === '' ? null : Number(row.diameter),
            startTime: row.startTime,
            endTime: row.endTime,
            date: row.date,
            brigade: row.brigade,
            coordinates: row.coordinates,
          }),
        });
        if (!res.ok) { const data = await res.json(); setError(data.error || 'Ошибка'); return; }
        showSuccess('Запись добавлена');
        fetchRecords();
      } catch { setError('Ошибка соединения'); }
    } else {
      try {
        const res = await fetch('/api/drilling', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: row.id,
            holeNumber: row.holeNumber,
            site: selectedSite,
            queue: row.queue === '' ? null : Number(row.queue),
            isDrilled: row.isDrilled === 'Да',
            diameter: row.diameter === '' ? null : Number(row.diameter),
            startTime: row.startTime,
            endTime: row.endTime,
            date: row.date,
            brigade: row.brigade,
            coordinates: row.coordinates,
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
          const res = await fetch('/api/drilling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              holeNumber: row.holeNumber,
              site: selectedSite,
              queue: row.queue === '' ? null : Number(row.queue),
              isDrilled: row.isDrilled === 'Да',
              diameter: row.diameter === '' ? null : Number(row.diameter),
              startTime: row.startTime,
              endTime: row.endTime,
              date: row.date,
              brigade: row.brigade,
              coordinates: row.coordinates,
            }),
          });
          if (res.ok) saved++;
        } else {
          const res = await fetch('/api/drilling', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              id: row.id,
              holeNumber: row.holeNumber,
              site: selectedSite,
              queue: row.queue === '' ? null : Number(row.queue),
              isDrilled: row.isDrilled === 'Да',
              diameter: row.diameter === '' ? null : Number(row.diameter),
              startTime: row.startTime,
              endTime: row.endTime,
              date: row.date,
              brigade: row.brigade,
              coordinates: row.coordinates,
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
      {
        id: 'new_' + Date.now(),
        holeNumber: '',
        site: getSelectedSite(),
        queue: '',
        isDrilled: 'Нет',
        diameter: '',
        startTime: '',
        endTime: '',
        date: '',
        brigade: '',
        coordinates: '',
      },
      ...prev,
    ]);
  }, [selectedSite]);

  const onDeleteRows = useCallback(async (rows) => {
    const ids = rows.map(r => r.id).filter(id => !String(id).startsWith('new_'));
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/drilling', {
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
        <h1 style={{ color: '#e0dcc8', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Буровые работы</h1>
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
