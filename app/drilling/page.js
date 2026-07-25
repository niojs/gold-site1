'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DrillingPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    site: '',
    date: '',
    holeNumber: '',
    diameter: '',
    startTime: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Загрузка записей
  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/drilling', { credentials: 'include' });
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

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/drilling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка сохранения');
        return;
      }

      setForm({ site: '', date: '', holeNumber: '', diameter: '', startTime: '', endTime: '' });
      fetchRecords();
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>🔧 Буровые работы</h1>

      {error && (
        <div className="gold-card" style={{ borderColor: '#cf6b5e', marginBottom: '1rem' }}>
          <p style={{ color: '#cf6b5e' }}>{error}</p>
        </div>
      )}

      {/* Форма */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Новая запись</h2>
        <form onSubmit={handleSubmit} className="form-row">
          <input
            className="input-gold"
            placeholder="Участок работ"
            value={form.site}
            onChange={(e) => setForm({ ...form, site: e.target.value })}
            required
          />
          <input
            className="input-gold"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Номер скважины"
            value={form.holeNumber}
            onChange={(e) => setForm({ ...form, holeNumber: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Диаметр (мм)"
            type="number"
            value={form.diameter}
            onChange={(e) => setForm({ ...form, diameter: e.target.value })}
            required
          />
          <input
            className="input-gold"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />
          <input
            className="input-gold"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />
          <button className="btn-gold" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Таблица записей */}
      <div className="gold-card table-wrapper">
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Мои записи</h2>
        <table className="table-gold">
          <thead>
            <tr>
              <th>Участок</th>
              <th>Дата</th>
              <th>Скважина</th>
              <th>Диаметр</th>
              <th>Начало</th>
              <th>Конец</th>
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
                  <td>{rec.site}</td>
                  <td>{new Date(rec.date).toLocaleDateString()}</td>
                  <td>{rec.hole_number}</td>
                  <td>{rec.diameter}</td>
                  <td>{rec.start_time || '—'}</td>
                  <td>{rec.end_time || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}