'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.role) {
          setUserRole(data.role);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const getMenuItems = () => {
    const common = [];

    const roleSpecific = {
      admin: [
        { href: '/dashboard', label: '📊 Дашборд' },
        { href: '/admin/users', label: '👥 Пользователи' },
        { href: '/table', label: '📋 Все данные' },
        { href: '/map', label: '🗺️ Карта' },
        { href: '/import-export', label: '📤 Импорт/Экспорт' },
      ],
      chief_geologist: [
        { href: '/dashboard', label: '📊 Дашборд' },
        { href: '/table', label: '📋 Все рабочие данные' },
        { href: '/map', label: '🗺️ Карта' },
        { href: '/import-export', label: '📤 Импорт/Экспорт' },
      ],
      field_geologist: [
        { href: '/dashboard', label: '📊 Дашборд' },
        { href: '/field-data', label: '📝 Полевые данные' },
        { href: '/map', label: '🗺️ Карта' },
      ],
      driller: [
        { href: '/drilling', label: '🔧 Буровые работы' },
        { href: '/map', label: '🗺️ Карта' },
      ],
      washer: [
        { href: '/washing', label: '🧪 Отдел промывки' },
      ],
      sampler: [
        { href: '/assay', label: '⚗️ Отдел проб' },
      ],
    };

    const menu = [...common, ...(roleSpecific[userRole] || [])];

    if (!userRole) {
      return [{ href: '/', label: '🔑 Войти' }];
    }

    return menu;
  };

  const menuItems = getMenuItems();

  return (
    <nav style={{
      background: '#1a1a1a',
      padding: '0.8rem 1.5rem',
      borderBottom: '1px solid #d4af37',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{ color: '#d4af37', fontSize: '1.2rem', fontWeight: 'bold' }}>
        ⚒️ Gold Manager
      </div>

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#d4af37',
          fontSize: '1.8rem',
          cursor: 'pointer',
          padding: '0.3rem 0.8rem',
        }}
        className="burger-btn"
      >
        ☰
      </button>

      <div style={{
        display: 'flex',
        gap: '1.2rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }} className="menu-links">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span style={{
              color: pathname === item.href ? '#d4af37' : '#cccccc',
              fontWeight: pathname === item.href ? 'bold' : 'normal',
              padding: '0.4rem 0.2rem',
              borderBottom: pathname === item.href ? '2px solid #d4af37' : 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </Link>
        ))}
        {userRole && (
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid #a67c6b',
              color: '#a67c6b',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: '0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#a67c6b';
              e.target.style.color = '#0d0d0d';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#a67c6b';
            }}
          >
            Выйти
          </button>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .burger-btn {
            display: block !important;
          }
          .menu-links {
            display: ${menuOpen ? 'flex' : 'none'} !important;
            flex-direction: column;
            width: 100%;
            gap: 0.6rem !important;
            padding-top: 0.8rem;
            border-top: 1px solid #333;
          }
          .menu-links a {
            width: 100%;
          }
          .menu-links span {
            display: block;
            padding: 0.5rem 0 !important;
            border-bottom: 1px solid #2a2a2a !important;
          }
          .menu-links button {
            width: 100%;
            text-align: center;
            padding: 0.5rem 0 !important;
          }
        }
      `}</style>
    </nav>
  );
}