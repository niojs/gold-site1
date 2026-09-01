'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoldGrid from '../components/GoldGrid';

function getSelectedSite() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/selected_site=([^;]+)/);
  const val = match ? decodeURIComponent(match[1]) : null;
  return val === '__none__' ? null : val;
}

export default function FieldDataPage() {
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

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/field-data', { credentials: 'include' });
      if (!res.ok) { if (res.status === 401) { router.push('/'); return; } }
      const data = await res.json();
      const site = getSelectedSite();
      const filtered = site ? data.filter(r => r.site === site) : data;
      setRecords(filtered);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (selectedSite) fetchRecords(); }, [selectedSite]);

  const columnDefs = [
    { field: 'holeNumber', headerName: 'Скважина', editable: true },
    { field: 'coordinates', headerName: 'Координаты', editable: true },
    { field: 'lineHeight', headerName: 'Высота', editable: true, type: 'numericColumn' },
    { field: 'intervals', headerName: 'Интервалы', editable: true },
    { field: 'geologicalDescription', headerName: 'Геология', editable: true },
    { field: 'ugv', headerName: 'УГВ', editable: true, type: 'numericColumn' },
    { field: 'diameter', headerName: 'Диаметр', editable: true, type: 'numericColumn' },
    { field: 'coreRecovery', headerName: 'Выход керна', editable: true, type: 'numericColumn' },
    { field: 'date', headerName: 'Дата', editable: true },
    { field: 'time', headerName: 'Время', editable: true },
    { field: 'brigade', headerName: 'Бригада', editable: true },
    { field: 'creatorName', headerName: 'Записал', editable: false },
  ];

  const rowData = records.map(r => ({
    id: r.id,
    holeNumber: r.hole_number || '',
    coordinates: r.coordinates || '',
    lineHeight: r.line_height || '',
    intervals: r.intervals || '',
    geologicalDescription: r.geological_description || '',
    ugv: r.ugv || '',
    diameter: r.diameter || '',
    coreRecovery: r.core_recovery || '',
    date: r.date || '',
    time: r.time || '',
    brigade: r.brigade || '',
    creatorName: r.creator_name || '',
  }));

  const getRowId = (params) => String(params.data.id);

  const onCellValueChanged = async (event) => {
    const { data } = event;
    const id = data.id;

    if (String(id).startsWith('new_')) {
      try {
        const res = await fetch('/api/field-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holeNumber: data.holeNumber,
            coordinates: data.coordinates,
            lineHeight: data.lineHeight,
            intervals: data.intervals,
            geologicalDescription: data.geologicalDescription,
            ugv: data.ugv,
            date: data.date,
            time: data.time,
            site: selectedSite,
            diameter: data.diameter,
            coreRecovery: data.coreRecovery,
            brigade: data.brigade,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Ошибка сохранения');
          setTimeout(() => setError(''), 3000);
          return;
        }
        setSuccess('Запись добавлена');
        setTimeout(() => setSuccess(''), 3000);
        fetchRecords();
      } catch (err) {
        setError('Ошибка соединения');
        setTimeout(() => setError(''), 3000);
      }
      return;
    }

    try {
      const res = await fetch('/api/field-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
          body: JSON.stringify({
            id,
            holeNumber: data.holeNumber,
            coordinates: data.coordinates,
            lineHeight: data.lineHeight,
            intervals: data.intervals,
            geologicalDescription: data.geologicalDescription,
            ugv: data.ugv,
            date: data.date,
            time: data.time,
            site: selectedSite,
            diameter: data.diameter,
            coreRecovery: data.coreRecovery,
            brigade: data.brigade,
          }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Ошибка сохранения');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setSuccess('Запись обновлена');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка соединения');
      setTimeout(() => setError(''), 3000);
    }
  };

  const onAddRow = () => {
    const newRow = {
      id: 'new_' + Date.now(),
      holeNumber: '',
      coordinates: '',
      lineHeight: '',
      intervals: '',
      geologicalDescription: '',
      ugv: '',
      diameter: '',
      coreRecovery: '',
      date: '',
      time: '',
      brigade: '',
      creatorName: '',
    };
    setRecords(prev => [newRow, ...prev]);
  };

  const onDeleteRows = async (rows) => {
    const ids = rows.map(r => r.id).filter(id => !String(id).startsWith('new_'));
    if (ids.length === 0) {
      setRecords(prev => prev.filter(r => String(r.id).startsWith('new_') || !rows.find(del => del.id === r.id)));
      return;
    }
    try {
      for (const id of ids) {
        await fetch('/api/field-data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });
      }
      setSuccess('Записи удалены');
      setTimeout(() => setSuccess(''), 3000);
      fetchRecords();
    } catch (err) {
      setError('Ошибка соединения');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e0dcc8', margin: 0 }}>Полевые данные</h1>
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
          color: '#cf6b5e', padding: '0.8rem 1.2rem', borderRadius: 12, marginBottom: '1rem',
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.4)',
          color: '#2ecc71', padding: '0.8rem 1.2rem', borderRadius: 12, marginBottom: '1rem',
        }}>{success}</div>
      )}

      <div style={{ background: 'rgba(20,18,14,0.5)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, padding: '1rem' }}>
        <GoldGrid
          columnDefs={columnDefs}
          rowData={rowData}
          onCellValueChanged={onCellValueChanged}
          onDeleteRows={onDeleteRows}
          onAddRow={onAddRow}
          addRowLabel="Добавить строку"
          getRowId={getRowId}
          height="70vh"
        />
      </div>
    </div>
  );
}
