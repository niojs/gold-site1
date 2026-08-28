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
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Gold Manager</div>
          <div className="login-divider" />
          <div className="login-subtitle">Вход в систему</div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="field">
            <label>Логин</label>
            <input
              type="text"
              placeholder="Введите логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>
      </div>

      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(20, 18, 15, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        /* ===== ШАПКА ===== */
        .login-header {
          text-align: center;
          margin-bottom: 2.2rem;
        }
        .login-logo {
          font-size: 1.9rem;
          font-weight: 600;
          color: #d4af37;
          letter-spacing: 1px;
        }
        .login-divider {
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 0.9rem auto;
        }
        .login-subtitle {
          color: #8a7e6a;
          font-size: 0.9rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* ===== ФОРМА ===== */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.3rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .field label {
          color: #a89a7e;
          font-size: 0.78rem;
          letter-spacing: 0.5px;
          padding-left: 0.2rem;
        }
        .field input {
          background: rgba(10, 10, 10, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.9rem 1rem;
          color: #e0dcc8;
          font-size: 1rem;
          transition: all 0.25s ease;
        }
        .field input::placeholder {
          color: #555;
        }
        .field input:focus {
          outline: none;
          border-color: #d4af37;
          background: rgba(10, 10, 10, 0.7);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        .field input:disabled {
          opacity: 0.5;
        }

        /* ===== КНОПКА ===== */
        .login-btn {
          margin-top: 0.5rem;
          background: linear-gradient(135deg, #d4af37, #b8901f);
          color: #0a0a0a;
          border: none;
          border-radius: 12px;
          padding: 1rem;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #e0bc45, #c99a25);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ===== ОШИБКА ===== */
        .login-error {
          color: #cf6b5e;
          font-size: 0.88rem;
          text-align: center;
          margin-top: 0.3rem;
        }
      `}</style>
    </div>
  );
}