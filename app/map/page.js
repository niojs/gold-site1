'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GoldGrid from '../components/GoldGrid';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <p style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка карты...</p>,
});

function getSelectedSite() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/selected_site=([^;]+)/);
  const val = match ? decodeURIComponent(match[1]) : null;
  return val === '__none__' ? null : val;
}

const columnDefs = [
  { headerName: 'Название', field: 'name', minWidth: 150 },
  { headerName: 'Скважина', field: 'hole_number', minWidth: 100 },
  { headerName: 'Участок', field: 'site', minWidth: 100 },
  { headerName: 'Диаметр', field: 'diameter', minWidth: 80, type: 'numericColumn' },
  {
    headerName: 'Очередь',
    field: 'queue',
    minWidth: 90,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: [1, 2, 3] },
  },
  { headerName: 'Бригада', field: 'brigade', minWidth: 100 },
  { headerName: 'Начало', field: 'start_time', minWidth: 100 },
  { headerName: 'Конец', field: 'end_time', minWidth: 100 },
  { headerName: 'Дата', field: 'date', minWidth: 110 },
  { headerName: 'Проект. коорд.', field: 'project_coordinates', minWidth: 130 },
  { headerName: 'Истин. коорд.', field: 'true_coordinates', minWidth: 130 },
  {
    headerName: 'Пробурена',
    field: 'is_drilled',
    minWidth: 100,
    cellRenderer: (params) => (params.value ? 'Да' : 'Нет'),
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['Да', 'Нет'] },
    valueSetter: (params) => {
      params.data.is_drilled = params.newValue === 'Да';
      return true;
    },
  },
];

export default function MapPage() {
  const [points, setPoints] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState('');
  const router = useRouter();

  useEffect(() => {
    const site = getSelectedSite();
    if (!site) { router.push('/select-site'); return; }
    setSelectedSite(site);
  }, []);

  const fetchPoints = async () => {
    try {
      const res = await fetch('/api/map/points', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/select-site');
        return;
      }
      const data = await res.json();
      const allPoints = data.points || [];
      const site = getSelectedSite();
      const filtered = site ? allPoints.filter(p => {
        const pointSite = p.site || p.name || '';
        return pointSite === site;
      }) : allPoints;
      setPoints(filtered);
      setCanEdit(data.currentUser?.canEdit || false);
    } catch (err) {
      console.error('Ошибка загрузки точек:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleCellValueChanged = async (event) => {
    const { data } = event;
    const isNew = String(data.id).startsWith('new_');

    if (isNew) {
      if (!data.name) return;
      try {
        const res = await fetch('/api/map/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            coordinates: data.coordinates || data.true_coordinates || data.project_coordinates || '',
            type: data.type || 'drilling',
            layer: data.layer || 'Скважина',
            hole_number: data.hole_number,
            date: data.date,
            site: data.site || selectedSite,
            diameter: data.diameter,
            start_time: data.start_time,
            end_time: data.end_time,
            queue: data.queue,
            is_drilled: data.is_drilled,
            project_coordinates: data.project_coordinates,
            true_coordinates: data.true_coordinates,
            brigade: data.brigade,
          }),
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Ошибка сохранения');
          return;
        }
        fetchPoints();
      } catch {
        alert('Ошибка соединения');
      }
      return;
    }

    try {
      const res = await fetch('/api/map/points', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          hole_number: data.hole_number,
          site: data.site,
          diameter: data.diameter,
          queue: data.queue,
          brigade: data.brigade,
          start_time: data.start_time,
          end_time: data.end_time,
          date: data.date,
          project_coordinates: data.project_coordinates,
          true_coordinates: data.true_coordinates,
          is_drilled: data.is_drilled,
          type: data.type,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Ошибка сохранения');
        fetchPoints();
      }
    } catch {
      alert('Ошибка соединения');
      fetchPoints();
    }
  };

  const handleAddRow = () => {
    setPoints(prev => [{
      id: 'new_' + Date.now(),
      name: '',
      hole_number: '',
      site: selectedSite,
      diameter: '',
      queue: 1,
      brigade: '',
      start_time: '',
      end_time: '',
      date: '',
      project_coordinates: '',
      true_coordinates: '',
      is_drilled: false,
      type: 'drilling',
      layer: 'Скважина',
      coordinates: '',
    }, ...prev]);
  };

  const handleDeleteRows = async (rows) => {
    try {
      for (const row of rows) {
        if (String(row.id).startsWith('new_')) continue;
        await fetch('/api/map/points', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: row.id, type: row.type }),
          credentials: 'include',
        });
      }
      fetchPoints();
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return <div style={{ color: '#d4af37', textAlign: 'center', padding: '3rem' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '1.6rem' }}>Карта участков</h1>
          {selectedSite && (
            <span style={{
              background: 'rgba(212,175,55,0.15)', color: '#d4af37',
              fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: 20,
            }}>{selectedSite}</span>
          )}
        </div>
      </div>

      <div style={{
        height: '50vh', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem',
        border: '1px solid #d4af37', boxShadow: '0 8px 32px rgba(212,175,55,0.15)',
      }}>
        <LeafletMap
          points={points}
          canEdit={canEdit}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>

      <GoldGrid
        columnDefs={columnDefs}
        rowData={points}
        onCellValueChanged={canEdit ? handleCellValueChanged : undefined}
        onDeleteRows={canEdit ? handleDeleteRows : undefined}
        onAddRow={canEdit ? handleAddRow : undefined}
        addRowLabel="Добавить строку"
        getRowId={(params) => params.data.id}
        height="45vh"
      />
    </div>
  );
}
