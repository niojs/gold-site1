'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (pathname === '/') {
      setIsLoading(false);
      return;
    }

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return <div style={{ color: '#d4af37', textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>;
  }

  if (pathname === '/') {
    return children;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="container">{children}</main>
    </>
  );
}