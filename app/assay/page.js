'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GoldGrid from '../components/GoldGrid';

function getSelectedSite() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/selected_site=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AssayPage() {
  const [records, setRecords] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const site = getSelectedSite();
    if (!site) { router.push('/select-site'); return; }
    setSelectedSite(site);
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/assay', { credentials: 'include' });
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
    { headerName: 'Скважина', field: 'holeNumber', editable: true },
    { headerName: 'Интервал', field: 'interval', editable: true },
    { headerName: 'Запасы (т)', field: 'reserves', editable: true, type: 'numericColumn' },
    { headerName: 'Отметки', field: 'marks', editable: true },
    { headerName: 'Вес пробы (кг)', field: 'sampleWeight', editable: true, type: 'numericColumn' },
    { headerName: 'Записал', field: 'creatorName', editable: false },
  ];

  const rowData = records.map(r => ({
    id: r.id,
    holeNumber: r.hole_number || '',
    interval: r.interval || '',
    reserves: r.reserves ?? '',
    marks: r.marks || '',
    sampleWeight: r.sample_weight ?? '',
    creatorName: r.creator_name || '',
    site: r.site || '',
  }));

  const onCellValueChanged = useCallback(async (e) => {
    const row = e.data;
    if (String(row.id).startsWith('new_')) {
      try {
        const res = await fetch('/api/assay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holeNumber: row.holeNumber,
            interval: row.interval,
            reserves: row.reserves === '' ? null : Number(row.reserves),
            marks: row.marks,
            sampleWeight: row.sampleWeight === '' ? null : Number(row.sampleWeight),
            site: selectedSite,
          }),
        });
        if (!res.ok) { const data = await res.json(); setError(data.error || 'Ошибка'); return; }
        showSuccess('Запись добавлена');
        fetchRecords();
      } catch { setError('Ошибка соединения'); }
    } else {
      try {
        const res = await fetch('/api/assay', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: row.id,
            holeNumber: row.holeNumber,
            interval: row.interval,
            reserves: row.reserves === '' ? null : Number(row.reserves),
            marks: row.marks,
            sampleWeight: row.sampleWeight === '' ? null : Number(row.sampleWeight),
            site: selectedSite,
          }),
        });
        if (!res.ok) { const data = await res.json(); setError(data.error || 'Ошибка'); return; }
        showSuccess('Запись обновлена');
      } catch { setError('Ошибка соединения'); }
    }
  }, [selectedSite, fetchRecords]);

  const onAddRow = useCallback(() => {
    setRecords(prev => [
      { id: 'new_' + Date.now(), holeNumber: '', interval: '', reserves: '', marks: '', sampleWeight: '', site: selectedSite, creatorName: '' },
      ...prev,
    ]);
  }, [selectedSite]);

  const onDeleteRows = useCallback(async (rows) => {
    const ids = rows.map(r => r.id).filter(id => !String(id).startsWith('new_'));
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/assay', {
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
        <h1 style={{ color: '#e0dcc8', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Отдел проб</h1>
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
        height="65vh"
      />
    </div>
  );
}
