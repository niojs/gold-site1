'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_REDIRECTS = {
  admin: '/dashboard',
  chief_geologist: '/dashboard',
  field_geologist: '/field-data',
  driller: '/drilling',
  washer: '/washing',
  sampler: '/assay',
};

const ROLE_LABELS = {
  admin: 'Администратор',
  chief_geologist: 'Главный геолог',
  field_geologist: 'Полевой геолог',
  driller: 'Буровик',
  washer: 'Промывка',
  sampler: 'Пробы',
};

export default function useAuth({ redirectToLogin = false, redirectToSite = false } = {}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      } else {
        if (redirectToLogin) router.push('/');
        return null;
      }
    } catch {
      if (redirectToLogin) router.push('/');
      return null;
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (username, password) => {
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        router.push(data.redirect || '/select-site');
        return true;
      } else {
        setError(data.error || 'Неверный логин или пароль');
        return false;
      }
    } catch {
      setError('Ошибка соединения с сервером');
      return false;
    }
  }, [router]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.cookie = 'session=; path=/; max-age=0';
    document.cookie = 'selected_site=; path=/; max-age=0';
    setUser(null);
    router.push('/');
  }, [router]);

  const getDefaultRedirect = useCallback(() => {
    if (!user) return '/';
    return ROLE_REDIRECTS[user.role] || '/map';
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    fetchUser,
    getDefaultRedirect,
    role: user?.role || null,
    roleLabel: ROLE_LABELS[user?.role] || user?.role || '',
    isAdmin: user?.role === 'admin',
    isChief: user?.role === 'chief_geologist',
    isDriller: user?.role === 'driller',
    isWasher: user?.role === 'washer',
    isSampler: user?.role === 'sampler',
    isFieldGeologist: user?.role === 'field_geologist',
  };
}
