'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        router.push(data.redirect || '/');
      } else {
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="gold-card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⚒️</div>
        <h1 style={{ color: '#d4af37', fontSize: '2rem', fontWeight: 300 }}>Gold Manager</h1>
        <p style={{ color: '#8a7e6a', marginBottom: '2rem' }}>Вход в систему</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input
            className="input-gold"
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
          <input
            className="input-gold"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button className="btn-gold" type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
          {error && <p style={{ color: '#cf6b5e' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}