'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <p style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка карты...</p>,
});

export default function MapPage() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    coordinates: '',
    type: 'drilling',
    layer: 'Скважина',
    holeNumber: '',
    date: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const fetchPoints = async () => {
    try {
      const res = await fetch('/api/map/points', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) router.push('/');
        return;
      }
      const data = await res.json();
      setPoints(data);
    } catch (err) {
      console.error('Ошибка загрузки точек:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.coordinates) {
      setError('Название и координаты обязательны');
      return;
    }

    try {
      const res = await fetch('/api/map/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Точка добавлена');
        setForm({ name: '', coordinates: '', type: 'drilling', layer: 'Скважина', holeNumber: '', date: '' });
        fetchPoints();
      } else {
        setError(data.error || 'Ошибка добавления');
      }
    } catch (err) {
      setError('Ошибка соединения');
    }
  };

  if (loading) {
    return <div style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>🗺️ Карта участков</h1>

      {/* Форма добавления точки */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Добавить точку</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            className="input-gold"
            placeholder="Название *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input-gold"
            placeholder="Координаты (широта, долгота) *"
            value={form.coordinates}
            onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
            required
          />
          <select
            className="input-gold"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="drilling">Буровая</option>
            <option value="field">Полевая</option>
          </select>
          <select
            className="input-gold"
            value={form.layer}
            onChange={(e) => setForm({ ...form, layer: e.target.value })}
          >
            <option value="Скважина">Скважина</option>
            <option value="Участок">Участок</option>
            <option value="Проба">Проба</option>
          </select>
          <input
            className="input-gold"
            placeholder="Номер скважины"
            value={form.holeNumber}
            onChange={(e) => setForm({ ...form, holeNumber: e.target.value })}
          />
          <input
            className="input-gold"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <button className="btn-gold" type="submit" style={{ gridColumn: '1 / -1' }}>
            Добавить точку
          </button>
          {error && <p style={{ color: '#cf6b5e', gridColumn: '1 / -1' }}>{error}</p>}
          {success && <p style={{ color: '#d4af37', gridColumn: '1 / -1' }}>{success}</p>}
        </form>
      </div>

      {/* Карта */}
      <div className="gold-card" style={{ height: '600px', padding: '0', overflow: 'hidden' }}>
        <LeafletMap points={points} />
      </div>
    </div>
  );
}