'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    avgGrade: 0,
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setUser(data);

        // Проверяем доступ
        if (!['admin', 'field_geologist', 'chief_geologist'].includes(data.role)) {
          router.push('/');
          return;
        }
      } catch (err) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки статистики:', err);
      }
    };

    fetchUser();
    fetchStats();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container" style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>
        Загрузка...
      </div>
    );
  }

  if (!user || !['admin', 'field_geologist', 'chief_geologist'].includes(user.role)) {
    return null;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ color: '#d4af37', fontSize: '2rem', fontWeight: 300 }}>⚒️ Панель управления</h1>
        <div>
          <span style={{ color: '#b0a48a', marginRight: '1rem' }}>Роль: {user.role || 'Не назначена'}</span>
          <button className="btn-outline-gold" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="gold-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>📋</div>
          <h3 style={{ color: '#b0a48a' }}>Всего записей</h3>
          <p style={{ fontSize: '2.8rem', color: '#d4af37' }}>{stats.total}</p>
        </div>
        <div className="gold-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>⛏️</div>
          <h3 style={{ color: '#b0a48a' }}>Активных</h3>
          <p style={{ fontSize: '2.8rem', color: '#d4af37' }}>{stats.active}</p>
        </div>
        <div className="gold-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>⭐</div>
          <h3 style={{ color: '#b0a48a' }}>Средняя проба</h3>
          <p style={{ fontSize: '2.8rem', color: '#d4af37' }}>
            {stats.avgGrade ? stats.avgGrade.toFixed(1) : '0.0'} г/т
          </p>
        </div>
      </div>

      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Динамика записей</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px', padding: '1rem 0' }}>
          {stats.monthlyData.length === 0 ? (
            <p style={{ color: '#8a7e6a' }}>Нет данных для графика</p>
          ) : (
            stats.monthlyData.map((item, index) => {
              const max = Math.max(...stats.monthlyData.map((i) => i.count), 1);
              const height = (item.count / max) * 180;
              return (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '40px',
                      height: `${height}px`,
                      background: 'linear-gradient(180deg, #d4af37, #a87b1c)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#8a7e6a', marginTop: '0.3rem' }}>
                    {item.month}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-gold" onClick={() => router.push('/drilling')}>
          🔧 Буровые работы
        </button>
        <button className="btn-gold" onClick={() => router.push('/field-data')}>
          📝 Полевые данные
        </button>
        <button className="btn-gold" onClick={() => router.push('/washing')}>
          🧪 Отдел промывки
        </button>
      </div>
    </div>
  );
}