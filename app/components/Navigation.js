'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.role) setUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.cookie = 'selected_site=; path=/; max-age=0';
    router.push('/');
  };

  const handleChangeSite = () => {
    router.push('/select-site');
  };

  const getMenuItems = () => {
    const roleSpecific = {
      admin: [
        { href: '/dashboard', label: 'Дашборд' },
        { href: '/primary-data', label: 'Данные' },
        { href: '/admin/users', label: 'Люди' },
        { href: '/table', label: 'Всё' },
        { href: '/map', label: 'Карта' },
        { href: '/import-export', label: 'Импорт' },
      ],
      chief_geologist: [
        { href: '/dashboard', label: 'Дашборд' },
        { href: '/primary-data', label: 'Данные' },
        { href: '/table', label: 'Всё' },
        { href: '/map', label: 'Карта' },
        { href: '/import-export', label: 'Импорт' },
      ],
      field_geologist: [
        { href: '/field-data', label: 'Полевые' },
        { href: '/map', label: 'Карта' },
      ],
      driller: [
        { href: '/drilling', label: 'Буровые' },
        { href: '/map', label: 'Карта' },
      ],
      washer: [{ href: '/washing', label: 'Промывка' }],
      sampler: [{ href: '/assay', label: 'Пробы' }],
    };

    if (!userRole) return [{ href: '/', label: 'Войти' }];
    return roleSpecific[userRole] || [];
  };

  const menuItems = getMenuItems();

  return (
    <nav className="nav-bar">
      <div className="nav-content">
        <Link href={userRole === 'admin' || userRole === 'chief_geologist' ? '/dashboard' : userRole ? '/map' : '/'} className="logo-link">
          <span className="logo-icon">⛏️</span>
          <span className="logo-text">Gold Manager</span>
        </Link>

        <div className="nav-links">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          {userRole && (
            <button onClick={handleChangeSite} className="nav-link site-btn">
              Сменить участок
            </button>
          )}
          {userRole && (
            <button onClick={handleLogout} className="nav-link logout-link">
              Выйти
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .nav-bar {
          background: rgba(15, 12, 8, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(212,175,55,0.12);
          padding: 0 1.5rem;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .nav-content {
          display: flex;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          height: 56px;
          gap: 2rem;
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          text-decoration: none;
          flex-shrink: 0;
          margin-right: 0.5rem;
        }
        .logo-icon { font-size: 1.15rem; }
        .logo-text {
          font-size: 1rem;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.3px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .nav-links::-webkit-scrollbar { display: none; }

        .nav-link {
          color: #8a7e6a;
          padding: 0.5rem 0.9rem;
          margin-right: 0.15rem;
          font-size: 0.85rem;
          white-space: nowrap;
          flex-shrink: 0;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
          background: none;
          border: none;
          font-family: inherit;
        }
        .nav-link:hover {
          color: #d4af37;
          background: rgba(212,175,55,0.08);
        }
        .nav-link.active {
          color: #d4af37;
          background: rgba(212,175,55,0.12);
          font-weight: 500;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }

        .site-btn {
          color: #8a7e6a;
        }
        .logout-link {
          color: #665;
        }
        .logout-link:hover {
          color: #cf6b5e;
          background: rgba(207,107,94,0.08);
        }

        @media (max-width: 900px) {
          .nav-content {
            height: auto;
            flex-wrap: wrap;
            padding: 0.5rem 0;
            gap: 0.5rem;
          }
          .nav-links {
            order: 3;
            width: 100%;
            overflow-x: auto;
            padding-bottom: 0.3rem;
          }
        }
      `}</style>
    </nav>
  );
}
