'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FieldDataPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    holeNumber: '',
    coordinates: '',
    lineHeight: '',
    intervals: '',
    geologicalDescription: '',
    ugv: '',
    date: '',
    time: '',
    site: '',
    diameter: '',
    coreRecovery: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/field-data', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) router.push('/');
        return;
      }
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { ...form, id: editingId } : form;

    try {
      const res = await fetch('/api/field-data', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка сохранения');
        return;
      }

      setForm({
        holeNumber: '',
        coordinates: '',
        lineHeight: '',
        intervals: '',
        geologicalDescription: '',
        ugv: '',
        date: '',
        time: '',
        site: '',
        diameter: '',
        coreRecovery: '',
      });
      setEditingId(null);
      fetchRecords();
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setForm({
      holeNumber: record.hole_number || '',
      coordinates: record.coordinates || '',
      lineHeight: record.line_height || '',
      intervals: record.intervals || '',
      geologicalDescription: record.geological_description || '',
      ugv: record.ugv || '',
      date: record.date || '',
      time: record.time || '',
      site: record.site || '',
      diameter: record.diameter || '',
      coreRecovery: record.core_recovery || '',
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить запись?')) return;

    try {
      const res = await fetch('/api/field-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка удаления');
        return;
      }

      fetchRecords();
    } catch (err) {
      setError('Ошибка соединения');
    }
  };

  return (
    <div className="container">
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>📝 Полевые данные</h1>

      {error && (
        <div className="gold-card" style={{ borderColor: '#cf6b5e', marginBottom: '1rem' }}>
          <p style={{ color: '#cf6b5e' }}>{error}</p>
        </div>
      )}

      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>
          {editingId ? 'Редактировать запись' : 'Новая запись'}
        </h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            className="input-gold"
            placeholder="Номер скважины *"
            value={form.holeNumber}
            onChange={(e) => setForm({ ...form, holeNumber: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Координаты *"
            value={form.coordinates}
            onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Линия высота"
            type="number"
            step="0.01"
            value={form.lineHeight}
            onChange={(e) => setForm({ ...form, lineHeight: e.target.value })}
          />
          <input
            className="input-gold"
            placeholder="Интервалы"
            value={form.intervals}
            onChange={(e) => setForm({ ...form, intervals: e.target.value })}
          />
          <input
            className="input-gold"
            placeholder="Геологическое описание"
            value={form.geologicalDescription}
            onChange={(e) => setForm({ ...form, geologicalDescription: e.target.value })}
          />
          <input
            className="input-gold"
            placeholder="УГВ"
            type="number"
            step="0.01"
            value={form.ugv}
            onChange={(e) => setForm({ ...form, ugv: e.target.value })}
          />
          <input
            className="input-gold"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            className="input-gold"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <input
            className="input-gold"
            placeholder="Участок работ *"
            value={form.site}
            onChange={(e) => setForm({ ...form, site: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Диаметр бурения (мм)"
            type="number"
            step="0.1"
            value={form.diameter}
            onChange={(e) => setForm({ ...form, diameter: e.target.value })}
          />
          <input
            className="input-gold"
            placeholder="Выход керна (%)"
            type="number"
            step="0.1"
            value={form.coreRecovery}
            onChange={(e) => setForm({ ...form, coreRecovery: e.target.value })}
          />
          <button className="btn-gold" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : editingId ? 'Обновить' : 'Сохранить'}
          </button>
          {editingId && (
            <button
              className="btn-outline-gold"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  holeNumber: '',
                  coordinates: '',
                  lineHeight: '',
                  intervals: '',
                  geologicalDescription: '',
                  ugv: '',
                  date: '',
                  time: '',
                  site: '',
                  diameter: '',
                  coreRecovery: '',
                });
              }}
            >
              Отмена
            </button>
          )}
        </form>
      </div>

      <div className="gold-card table-wrapper">
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Мои записи</h2>
        <table className="table-gold">
          <thead>
            <tr>
              <th>Скважина</th>
              <th>Координаты</th>
              <th>Участок</th>
              <th>Дата</th>
              <th>Время</th>
              <th style={{ textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#8a7e6a' }}>
                  Нет записей
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id}>
                  <td>{rec.hole_number}</td>
                  <td>{rec.coordinates}</td>
                  <td>{rec.site}</td>
                  <td>{rec.date ? new Date(rec.date).toLocaleDateString() : '—'}</td>
                  <td>{rec.time || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(rec)}
                      style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      style={{ background: 'none', border: 'none', color: '#a67c6b', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}