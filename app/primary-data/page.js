'use client';

import { useState, useEffect, useCallback } from 'react';
import GoldGrid from '../components/GoldGrid';

export default function PrimaryDataPage() {
  const [records, setRecords] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSites, setUserSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('data');
  const [success, setSuccess] = useState('');

  const [assignForm, setAssignForm] = useState({ userId: '', siteName: '' });

  const roleLabels = {
    admin: 'Администратор',
    chief_geologist: 'Главный геолог',
    field_geologist: 'Полевой геолог',
    driller: 'Бурильщик',
    washer: 'Промывка',
    sampler: 'Пробы',
  };

  useEffect(() => {
    fetchRecords();
    fetchUsers();
    fetchUserSites();
  }, []);

  async function fetchRecords() {
    const res = await fetch('/api/primary-data');
    if (res.ok) {
      const data = await res.json();
      setRecords(data.records || []);
      setSites(data.sites || []);
    }
    setLoading(false);
  }

  async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.filter(u => ['driller', 'field_geologist', 'washer', 'sampler'].includes(u.role)));
    }
  }

  async function fetchUserSites() {
    const res = await fetch('/api/user-sites');
    if (res.ok) {
      const data = await res.json();
      if (data.assignments) setUserSites(data.assignments);
      else if (data.sites) setUserSites(data.sites);
    }
  }

  async function handleCellValueChanged(params) {
    const { data } = params;
    const isNew = String(data.id).startsWith('temp-');

    const payload = {
      workArea: data.work_area,
      lineName: data.line_name,
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: data.elevation,
      holeNumber: data.hole_number,
      diameter: data.diameter,
      intervals: data.intervals,
    };

    if (isNew) {
      if (!payload.workArea || !payload.holeNumber) return;
      const res = await fetch('/api/primary-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        setRecords(prev => prev.map(r => r.id === data.id ? { ...data, id: result.id, isNew: false } : r));
        setSuccess('Запись добавлена');
      } else {
        setSuccess('Ошибка сохранения');
      }
    } else {
      payload.id = data.id;
      const res = await fetch('/api/primary-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess('Запись обновлена');
      } else {
        fetchRecords();
        setSuccess('Ошибка сохранения');
      }
    }
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleDeleteRows(rows) {
    const ids = rows.map(r => r.id);
    const tempIds = ids.filter(id => String(id).startsWith('temp-'));
    const dbIds = ids.filter(id => !String(id).startsWith('temp-'));

    if (tempIds.length > 0) {
      setRecords(prev => prev.filter(r => !tempIds.includes(r.id)));
    }

    for (const id of dbIds) {
      await fetch(`/api/primary-data?id=${id}`, { method: 'DELETE' });
    }
    if (dbIds.length > 0) fetchRecords();
  }

  async function handleAddRow() {
    const newRow = {
      id: `temp-${Date.now()}`,
      work_area: '',
      line_name: '',
      latitude: null,
      longitude: null,
      elevation: null,
      hole_number: '',
      diameter: '',
      intervals: '',
      created_by: '',
      creator_name: '',
      isNew: true,
    };
    setRecords(prev => [...prev, newRow]);
  }

  async function handleAssign(e) {
    e.preventDefault();
    const res = await fetch('/api/user-sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignForm),
    });
    if (res.ok) {
      setAssignForm({ userId: '', siteName: '' });
      setSuccess('Участок назначен');
      setTimeout(() => setSuccess(''), 3000);
      fetchUserSites();
    }
  }

  async function handleUnassign(id) {
    const res = await fetch(`/api/user-sites?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchUserSites();
  }

  const columnDefs = [
    {
      headerName: 'Скважина',
      field: 'hole_number',
      editable: true,
      minWidth: 120,
    },
    {
      headerName: 'Участок',
      field: 'work_area',
      editable: true,
      minWidth: 120,
    },
    {
      headerName: 'Линия',
      field: 'line_name',
      editable: true,
      minWidth: 100,
    },
    {
      headerName: 'Широта',
      field: 'latitude',
      editable: true,
      type: 'numericColumn',
      minWidth: 100,
    },
    {
      headerName: 'Долгота',
      field: 'longitude',
      editable: true,
      type: 'numericColumn',
      minWidth: 100,
    },
    {
      headerName: 'Высота',
      field: 'elevation',
      editable: true,
      type: 'numericColumn',
      minWidth: 90,
    },
    {
      headerName: 'Диаметр',
      field: 'diameter',
      editable: true,
      minWidth: 100,
    },
    {
      headerName: 'Интервалы',
      field: 'intervals',
      editable: true,
      minWidth: 140,
    },
    {
      headerName: 'Создал',
      field: 'creator_name',
      editable: false,
      minWidth: 120,
    },
  ];

  const getRowId = useCallback((params) => {
    return params.data.id;
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Первичные данные</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={activeTab === 'data' ? 'btn-gold' : 'btn-outline-gold'}
          onClick={() => setActiveTab('data')}
        >
          Данные
        </button>
        <button
          className={activeTab === 'assign' ? 'btn-gold' : 'btn-outline-gold'}
          onClick={() => setActiveTab('assign')}
        >
          Назначение участков
        </button>
      </div>

      {success && (
        <div style={{
          background: 'rgba(46, 204, 113, 0.1)',
          border: '1px solid rgba(46, 204, 113, 0.4)',
          color: '#2ecc71',
          padding: '0.8rem 1.2rem',
          borderRadius: 12,
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          {success}
        </div>
      )}

      {activeTab === 'data' && (
        <div>
          {!loading && (
            <GoldGrid
              columnDefs={columnDefs}
              rowData={records}
              onCellValueChanged={handleCellValueChanged}
              onDeleteRows={handleDeleteRows}
              onAddRow={handleAddRow}
              addRowLabel="Добавить строку"
              getRowId={getRowId}
              height="65vh"
            />
          )}
        </div>
      )}

      {activeTab === 'assign' && (
        <div>
          <div className="gold-card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1.2rem' }}>Назначить участок</h2>
            <form onSubmit={handleAssign}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#a89a7e', fontSize: '0.78rem', marginBottom: '0.3rem' }}>Пользователь *</label>
                  <select
                    className="input-gold"
                    value={assignForm.userId}
                    onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}
                    required
                  >
                    <option value="">Выберите</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({roleLabels[u.role] || u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#a89a7e', fontSize: '0.78rem', marginBottom: '0.3rem' }}>Участок *</label>
                  <input
                    className="input-gold"
                    value={assignForm.siteName}
                    onChange={e => setAssignForm({ ...assignForm, siteName: e.target.value })}
                    placeholder="Название участка"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-gold">Назначить</button>
            </form>
          </div>

          <div className="table-wrapper">
            <table className="table-gold">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Роль</th>
                  <th>Участок</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {userSites.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.username || a.user_id}</td>
                    <td>{roleLabels[a.user_role] || a.user_role}</td>
                    <td style={{ color: '#d4af37' }}>{a.site_name}</td>
                    <td>
                      <button
                        onClick={() => handleUnassign(a.id)}
                        style={{
                          background: 'none', border: 'none', color: '#cf6b5e',
                          cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: 6,
                          fontSize: '0.85rem', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(207,107,94,0.15)'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
                {userSites.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#555', padding: '1.5rem' }}>Нет назначений</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
