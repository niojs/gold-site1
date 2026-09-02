'use client';

import { useState, useEffect, useCallback } from 'react';
import GoldGrid from '../components/GoldGrid';

function getSelectedSite() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/selected_site=([^;]+)/);
  const val = match ? decodeURIComponent(match[1]) : null;
  return val === '__none__' ? null : val;
}

export default function PrimaryDataPage() {
  const [records, setRecords] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSites, setUserSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('data');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [assignForm, setAssignForm] = useState({ userId: '', siteName: '' });
  const [newSiteName, setNewSiteName] = useState('');
  const [editingSite, setEditingSite] = useState(null);

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
    fetchSitesList();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch('/api/primary-data');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter(u => ['driller', 'field_geologist', 'washer', 'sampler'].includes(u.role)));
      }
    } catch (e) { console.error(e); }
  }

  async function fetchUserSites() {
    try {
      const res = await fetch('/api/user-sites');
      if (res.ok) {
        const data = await res.json();
        if (data.assignments) setUserSites(data.assignments);
        else if (data.sites) setUserSites(data.sites);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchSitesList() {
    try {
      const res = await fetch('/api/sites');
      if (res.ok) {
        const data = await res.json();
        setSitesList(data);
      }
    } catch (e) { console.error(e); }
  }

  const showMsg = (msg, isError) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

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
        showMsg('Запись добавлена');
      } else {
        const err = await res.json();
        showMsg(err.error || 'Ошибка сохранения', true);
      }
    } else {
      payload.id = data.id;
      const res = await fetch('/api/primary-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMsg('Запись обновлена');
      } else {
        fetchRecords();
        showMsg('Ошибка сохранения', true);
      }
    }
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
      work_area: getSelectedSite(),
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
      showMsg('Участок назначен');
      fetchUserSites();
    }
  }

  async function handleUnassign(id) {
    const res = await fetch(`/api/user-sites?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchUserSites();
  }

  async function handleAddSite(e) {
    e.preventDefault();
    if (!newSiteName.trim()) return;
    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSiteName }),
    });
    if (res.ok) {
      setNewSiteName('');
      showMsg('Участок добавлен');
      fetchSitesList();
    } else {
      const err = await res.json();
      showMsg(err.error || 'Ошибка', true);
    }
  }

  async function handleRenameSite(id, newName) {
    if (!newName.trim()) return;
    const res = await fetch('/api/sites', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: newName }),
    });
    if (res.ok) {
      setEditingSite(null);
      showMsg('Участок переименован');
      fetchSitesList();
    } else {
      const err = await res.json();
      showMsg(err.error || 'Ошибка', true);
    }
  }

  async function handleDeleteSite(id) {
    if (!confirm('Удалить участок?')) return;
    const res = await fetch(`/api/sites?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      showMsg('Участок удалён');
      fetchSitesList();
    }
  }

  async function handleSaveAll() {
    const newRecords = records.filter(r => String(r.id).startsWith('temp-'));
    const editRecords = records.filter(r => !String(r.id).startsWith('temp-') && r.isNew !== false);

    for (const r of newRecords) {
      if (!r.work_area || !r.hole_number) continue;
      await fetch('/api/primary-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workArea: r.work_area,
          lineName: r.line_name,
          latitude: r.latitude,
          longitude: r.longitude,
          elevation: r.elevation,
          holeNumber: r.hole_number,
          diameter: r.diameter,
          intervals: r.intervals,
        }),
      });
    }

    for (const r of editRecords) {
      await fetch('/api/primary-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: r.id,
          workArea: r.work_area,
          lineName: r.line_name,
          latitude: r.latitude,
          longitude: r.longitude,
          elevation: r.elevation,
          holeNumber: r.hole_number,
          diameter: r.diameter,
          intervals: r.intervals,
        }),
      });
    }

    showMsg('Все данные сохранены');
    fetchRecords();
  }

  const columnDefs = [
    { headerName: 'Скважина', field: 'hole_number', editable: true, minWidth: 120, cellEditor: 'agTextCellEditor' },
    { headerName: 'Участок', field: 'work_area', editable: true, minWidth: 120 },
    { headerName: 'Линия', field: 'line_name', editable: true, minWidth: 100 },
    { headerName: 'Широта', field: 'latitude', editable: true, type: 'numericColumn', minWidth: 100 },
    { headerName: 'Долгота', field: 'longitude', editable: true, type: 'numericColumn', minWidth: 100 },
    { headerName: 'Высота', field: 'elevation', editable: true, type: 'numericColumn', minWidth: 90 },
    { headerName: 'Диаметр', field: 'diameter', editable: true, minWidth: 100 },
    { headerName: 'Интервалы', field: 'intervals', editable: true, minWidth: 140, cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true },
    { headerName: 'Создал', field: 'creator_name', editable: false, minWidth: 120 },
  ];

  const getRowId = useCallback((params) => params.data.id, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Первичные данные</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={activeTab === 'data' ? 'btn-gold' : 'btn-outline-gold'} onClick={() => setActiveTab('data')}>
          Данные
        </button>
        <button className={activeTab === 'sites' ? 'btn-gold' : 'btn-outline-gold'} onClick={() => setActiveTab('sites')}>
          Участки
        </button>
        <button className={activeTab === 'assign' ? 'btn-gold' : 'btn-outline-gold'} onClick={() => setActiveTab('assign')}>
          Назначение участков
        </button>
      </div>

      {success && (
        <div style={{
          background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.4)',
          color: '#2ecc71', padding: '0.8rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.9rem',
        }}>{success}</div>
      )}
      {error && (
        <div style={{
          background: 'rgba(207,107,94,0.1)', border: '1px solid rgba(207,107,94,0.4)',
          color: '#cf6b5e', padding: '0.8rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.9rem',
        }}>{error}</div>
      )}

      {activeTab === 'data' && (
        <div>
          {loading ? (
            <div style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка...</div>
          ) : (
            <GoldGrid
              columnDefs={columnDefs}
              rowData={records}
              onCellValueChanged={handleCellValueChanged}
              onDeleteRows={handleDeleteRows}
              onAddRow={handleAddRow}
              addRowLabel="Добавить строку"
              getRowId={getRowId}
              onSave={handleSaveAll}
              saveLabel="Сохранить"
              height="65vh"
            />
          )}
        </div>
      )}

      {activeTab === 'sites' && (
        <div>
          <div className="gold-card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1.2rem' }}>Добавить участок</h2>
            <form onSubmit={handleAddSite} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#a89a7e', fontSize: '0.78rem', marginBottom: '0.3rem' }}>Название участка *</label>
                <input
                  className="input-gold"
                  value={newSiteName}
                  onChange={e => setNewSiteName(e.target.value)}
                  placeholder="Например: Участок-1"
                  required
                />
              </div>
              <button type="submit" className="btn-gold" style={{ height: 'fit-content', whiteSpace: 'nowrap' }}>Добавить</button>
            </form>
          </div>

          <div className="table-wrapper">
            <table className="table-gold">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Источник</th>
                  <th>Создан</th>
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {sitesList.map((site, i) => (
                  <tr key={site.id || `extra-${i}`}>
                    <td style={{ fontWeight: 500, color: '#d4af37' }}>
                      {editingSite?.id === site.id ? (
                        <input
                          className="input-gold"
                          value={editingSite.name}
                          onChange={e => setEditingSite({ ...editingSite, name: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameSite(site.id, editingSite.name); if (e.key === 'Escape') setEditingSite(null); }}
                          autoFocus
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}
                        />
                      ) : (
                        site.name
                      )}
                    </td>
                    <td style={{ color: '#8a7e6a', fontSize: '0.82rem' }}>
                      {site.managed ? (
                        <span style={{ color: '#2ecc71' }}>Управляемый</span>
                      ) : (
                        <span>Из данных</span>
                      )}
                    </td>
                    <td style={{ color: '#8a7e6a', fontSize: '0.85rem' }}>
                      {site.created_at ? new Date(site.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {site.managed ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {editingSite?.id === site.id ? (
                            <>
                              <button
                                onClick={() => handleRenameSite(site.id, editingSite.name)}
                                style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem 0.6rem', borderRadius: 6 }}
                              >Сохранить</button>
                              <button
                                onClick={() => setEditingSite(null)}
                                style={{ background: 'none', border: 'none', color: '#8a7e6a', cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem 0.6rem', borderRadius: 6 }}
                              >Отмена</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingSite({ id: site.id, name: site.name })}
                                style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem 0.6rem', borderRadius: 6 }}
                                onMouseEnter={e => e.target.style.background = 'rgba(212,175,55,0.15)'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                              >Изменить</button>
                              <button
                                onClick={() => handleDeleteSite(site.id)}
                                style={{ background: 'none', border: 'none', color: '#cf6b5e', cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem 0.6rem', borderRadius: 6 }}
                                onMouseEnter={e => e.target.style.background = 'rgba(207,107,94,0.15)'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                              >Удалить</button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {sitesList.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#555', padding: '1.5rem' }}>Нет участков. Добавьте участок или создайте запись с указанием участка</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
                  <select
                    className="input-gold"
                    value={assignForm.siteName}
                    onChange={e => setAssignForm({ ...assignForm, siteName: e.target.value })}
                    required
                  >
                    <option value="">Выберите</option>
                    {sitesList.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
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
                        style={{ background: 'none', border: 'none', color: '#cf6b5e', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.85rem' }}
                        onMouseEnter={e => e.target.style.background = 'rgba(207,107,94,0.15)'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >Удалить</button>
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
