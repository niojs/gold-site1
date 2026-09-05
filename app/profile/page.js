'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_LABELS = {
  admin: 'Администратор',
  chief_geologist: 'Главный геолог',
  field_geologist: 'Полевой геолог',
  driller: 'Буровик',
  washer: 'Промывка',
  sampler: 'Пробы',
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setUser)
      .catch(() => router.push('/'));
  }, [router]);

  const handleChange = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Пароль изменён');
        setOldPassword('');
        setNewPassword('');
      } else {
        setErr(data.error || 'Ошибка смены пароля');
      }
    } catch {
      setErr('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ color: '#d4af37', textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>;
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ color: '#d4af37', fontSize: '1.6rem', marginBottom: '0.3rem' }}>Профиль</h1>
      <p style={{ color: '#8a7e6a', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        {user.username} · {ROLE_LABELS[user.role] || user.role}
      </p>

      <div className="gold-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ color: '#d4af37', fontSize: '1.05rem', marginBottom: '1rem' }}>Смена пароля</h2>
        <form onSubmit={handleChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ color: '#a89a7e', fontSize: '0.78rem' }}>Старый пароль</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={loading}
              style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.9rem 1rem', color: '#e0dcc8', fontSize: '1rem' }}
            />
          </div>
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ color: '#a89a7e', fontSize: '0.78rem' }}>Новый пароль (минимум 6 символов)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.9rem 1rem', color: '#e0dcc8', fontSize: '1rem' }}
            />
          </div>
          <button className="btn-gold" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сменить пароль'}
          </button>
          {msg && <p style={{ color: '#7dc98a', fontSize: '0.88rem', textAlign: 'center' }}>{msg}</p>}
          {err && <p style={{ color: '#cf6b5e', fontSize: '0.88rem', textAlign: 'center' }}>{err}</p>}
        </form>
      </div>
    </div>
  );
}
