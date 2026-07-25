'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WashingPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    holeNumber: '',
    interval: '',
    mass: '',
    volume: '',
    visualDescription: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/washing', { credentials: 'include' });
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
      const res = await fetch('/api/washing', {
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

      setForm({ holeNumber: '', interval: '', mass: '', volume: '', visualDescription: '' });
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
      interval: record.interval || '',
      mass: record.mass || '',
      volume: record.volume || '',
      visualDescription: record.visual_description || '',
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить запись?')) return;

    try {
      const res = await fetch('/api/washing', {
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
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>🧪 Отдел промывки</h1>

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
            placeholder="Интервал *"
            value={form.interval}
            onChange={(e) => setForm({ ...form, interval: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Масса (кг) *"
            type="number"
            step="0.01"
            value={form.mass}
            onChange={(e) => setForm({ ...form, mass: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Объём (л) *"
            type="number"
            step="0.01"
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Визуальное определение"
            value={form.visualDescription}
            onChange={(e) => setForm({ ...form, visualDescription: e.target.value })}
            style={{ gridColumn: '1 / -1' }} // Растягиваем на всю ширину
          />
          <button className="btn-gold" type="submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
            {loading ? 'Сохранение...' : editingId ? 'Обновить' : 'Сохранить'}
          </button>
          {editingId && (
            <button
              className="btn-outline-gold"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ holeNumber: '', interval: '', mass: '', volume: '', visualDescription: '' });
              }}
              style={{ gridColumn: '1 / -1' }}
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
              <th>Интервал</th>
              <th>Масса</th>
              <th>Объём</th>
              <th>Визуальное описание</th>
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
                  <td>{rec.interval}</td>
                  <td>{rec.mass}</td>
                  <td>{rec.volume}</td>
                  <td>{rec.visual_description || '—'}</td>
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