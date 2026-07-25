// app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'user',
  });
  const router = useRouter();

  // Доступные роли
  const roles = [
    { value: 'admin', label: 'Администратор' },
    { value: 'chief_geologist', label: 'Главный геолог' },
    { value: 'field_geologist', label: 'Полевой геолог' },
    { value: 'driller', label: 'Буровщик' },
    { value: 'washer', label: 'Отдел промывки' },
    { value: 'sampler', label: 'Отдувщик' },
  ];

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Ошибка загрузки');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Добавление пользователя
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка создания');
        return;
      }

      setForm({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError('Ошибка сервера');
    }
  };

  // Изменение роли
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка обновления');
        return;
      }

      fetchUsers();
    } catch (err) {
      setError('Ошибка сервера');
    }
  };

  // Удаление пользователя
  const handleDelete = async (userId) => {
    if (!confirm('Удалить пользователя?')) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка удаления');
        return;
      }

      fetchUsers();
    } catch (err) {
      setError('Ошибка сервера');
    }
  };

  if (loading) {
    return <div className="container" style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>👥 Управление пользователями</h1>

      {error && (
        <div className="gold-card" style={{ borderColor: '#cf6b5e', marginBottom: '1rem' }}>
          <p style={{ color: '#cf6b5e' }}>{error}</p>
        </div>
      )}

      {/* Форма добавления */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Добавить пользователя</h2>
        <form onSubmit={handleSubmit} className="form-row">
          <input
            className="input-gold"
            placeholder="Логин"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            className="input-gold"
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <select
            className="input-gold"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button className="btn-gold" type="submit">
            Добавить
          </button>
        </form>
      </div>

      {/* Таблица пользователей */}
      <div className="gold-card table-wrapper">
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Список пользователей</h2>
        <table className="table-gold">
          <thead>
            <tr>
              <th>Логин</th>
              <th>Роль</th>
              <th>Дата создания</th>
              <th style={{ textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#8a7e6a' }}>
                  Нет пользователей
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>
                    <select
                      className="input-gold"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ maxWidth: '180px', padding: '0.3rem' }}
                    >
                      {roles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a67c6b',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                      }}
                      disabled={user.username === 'admin'}
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