'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AllDataPage() {
  const [data, setData] = useState({
    drilling: [],
    field: [],
    washing: [],
    assay: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await fetch('/api/table/all', { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) router.push('/');
          if (res.status === 403) router.push('/');
          return;
        }
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [router]);

  if (loading) {
    return <div style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ color: '#cf6b5e', textAlign: 'center', padding: '2rem' }}>{error}</div>;
  }

  return (
    <div className="container">
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>📋 Все данные</h1>

      {/* Буровые работы */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>🔧 Буровые работы</h2>
        <div className="table-wrapper">
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
              {data.drilling.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8a7e6a' }}>Нет записей</td></tr>
              ) : (
                data.drilling.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.site}</td>
                    <td>{rec.date ? new Date(rec.date).toLocaleDateString() : '—'}</td>
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

      {/* Полевые данные */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>📝 Полевые данные</h2>
        <div className="table-wrapper">
          <table className="table-gold">
            <thead>
              <tr>
                <th>Скважина</th>
                <th>Координаты</th>
                <th>Участок</th>
                <th>Дата</th>
                <th>Время</th>
              </tr>
            </thead>
            <tbody>
              {data.field.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8a7e6a' }}>Нет записей</td></tr>
              ) : (
                data.field.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.hole_number}</td>
                    <td>{rec.coordinates}</td>
                    <td>{rec.site}</td>
                    <td>{rec.date ? new Date(rec.date).toLocaleDateString() : '—'}</td>
                    <td>{rec.time || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Отдел промывки */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>🧪 Отдел промывки</h2>
        <div className="table-wrapper">
          <table className="table-gold">
            <thead>
              <tr>
                <th>Скважина</th>
                <th>Интервал</th>
                <th>Масса</th>
                <th>Объём</th>
                <th>Визуальное описание</th>
              </tr>
            </thead>
            <tbody>
              {data.washing.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8a7e6a' }}>Нет записей</td></tr>
              ) : (
                data.washing.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.hole_number}</td>
                    <td>{rec.interval}</td>
                    <td>{rec.mass}</td>
                    <td>{rec.volume}</td>
                    <td>{rec.visual_description || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Отдел проб */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>⚗️ Отдел проб</h2>
        <div className="table-wrapper">
          <table className="table-gold">
            <thead>
              <tr>
                <th>Скважина</th>
                <th>Интервал</th>
                <th>Запасы</th>
                <th>Отметки</th>
                <th>Вес пробы</th>
              </tr>
            </thead>
            <tbody>
              {data.assay.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8a7e6a' }}>Нет записей</td></tr>
              ) : (
                data.assay.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.hole_number}</td>
                    <td>{rec.interval}</td>
                    <td>{rec.reserves}</td>
                    <td>{rec.marks || '—'}</td>
                    <td>{rec.sample_weight}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}