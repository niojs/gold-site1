'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_REDIRECTS = {
  admin: '/map',
  chief_geologist: '/map',
  field_geologist: '/field-data',
  driller: '/drilling',
  washer: '/washing',
  sampler: '/assay',
};

const ROLE_LABELS = {
  admin: 'Администратор',
  chief_geologist: 'Главный геолог',
  field_geologist: 'Полевой геолог',
  driller: 'Бурильщик',
  washer: 'Промывка',
  sampler: 'Пробы',
};

export default function SelectSitePage() {
  const [sites, setSites] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchSites();
  }, []);

  async function fetchUser() {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      router.push('/');
    }
  }

  async function fetchSites() {
    const res = await fetch('/api/available-sites');
    if (res.ok) {
      const data = await res.json();
      setSites(data.sites || []);
    }
    setLoading(false);
  }

  function handleSelect(site) {
    setSelectedSite(site);
    document.cookie = `selected_site=${encodeURIComponent(site)}; path=/; max-age=${60 * 60 * 24}`;
    const redirect = ROLE_REDIRECTS[user?.role] || '/map';
    router.push(redirect);
  }

  function handleGoWithoutSite() {
    document.cookie = `selected_site=__none__; path=/; max-age=${60 * 60 * 24}`;
    const redirect = ROLE_REDIRECTS[user?.role] || '/map';
    router.push(redirect);
  }

  function handleLogout() {
    document.cookie = 'session=; path=/; max-age=0';
    document.cookie = 'selected_site=; path=/; max-age=0';
    router.push('/');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#d4af37', fontSize: '1.1rem' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⚒️</div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Выберите участок</h1>
        {user && (
          <p style={{ color: '#8a7e6a', fontSize: '0.9rem' }}>
            {user.username} · {ROLE_LABELS[user.role] || user.role}
          </p>
        )}
      </div>

      {sites.length === 0 ? (
        <div className="gold-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
          <h2 style={{ color: '#d4af37', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Нет доступных участков</h2>
          {(user?.role === 'admin' || user?.role === 'chief_geologist') ? (
            <>
              <p style={{ color: '#8a7e6a', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Перейдите в «Первичные данные» чтобы добавить участки
              </p>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-gold" onClick={() => { document.cookie = `selected_site=__none__; path=/; max-age=${60 * 60 * 24}`; router.push('/primary-data'); }}>
                  Добавить участки
                </button>
                <button className="btn-outline-gold" onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#8a7e6a', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Обратитесь к администратору для назначения участка
              </p>
              <button className="btn-outline-gold" onClick={handleLogout}>
                Выйти
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sites.map((site, i) => (
            <button
              key={site}
              onClick={() => handleSelect(site)}
              className="gold-card"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '1.3rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.7), 0 0 25px rgba(212,175,55,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6)';
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', flexShrink: 0,
                border: '1px solid rgba(212,175,55,0.2)',
              }}>
                🗺️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#d4af37', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                  {site}
                </div>
                <div style={{ color: '#8a7e6a', fontSize: '0.8rem' }}>
                  Нажмите для выбора
                </div>
              </div>
              <div style={{ color: '#d4af37', fontSize: '1.2rem', opacity: 0.5 }}>→</div>
            </button>
          ))}
          {(user?.role === 'admin' || user?.role === 'chief_geologist') && (
            <button
              onClick={handleGoWithoutSite}
              style={{
                background: 'none', border: '1px solid rgba(212,175,55,0.15)',
                color: '#8a7e6a', cursor: 'pointer', fontSize: '0.85rem',
                padding: '0.7rem 1rem', borderRadius: 12, marginTop: '0.5rem',
                textAlign: 'center', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.color = '#d4af37'; e.target.style.borderColor = 'rgba(212,175,55,0.4)'; }}
              onMouseLeave={e => { e.target.style.color = '#8a7e6a'; e.target.style.borderColor = 'rgba(212,175,55,0.15)'; }}
            >
              Войти без выбора участка
            </button>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', color: '#8a7e6a',
            cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = '#d4af37'}
          onMouseLeave={e => e.target.style.color = '#8a7e6a'}
        >
          Выйти из системы
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
