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
          background: #0d0b08;
          border-bottom: 1px solid rgba(212,175,55,0.15);
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .nav-content {
          display: flex;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          height: 52px;
          gap: 2.5rem;
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .logo-icon { font-size: 1.2rem; }
        .logo-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.4rem;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .nav-links::-webkit-scrollbar { display: none; }

        .nav-link {
          color: #d6cfbc;
          padding: 0.4rem 0.15rem;
          margin-right: 0;
          font-size: 0.92rem;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          border-radius: 0;
          text-decoration: none;
          transition: color 0.15s;
          cursor: pointer;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-family: inherit;
        }
        .nav-link:hover {
          color: #d4af37;
          background: none;
        }
        .nav-link.active {
          color: #d4af37;
          background: none;
          font-weight: 600;
          border-bottom-color: #d4af37;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1.6rem;
          flex-shrink: 0;
          margin-left: auto;
        }

        .site-btn {
          color: #8a7e6a;
          font-size: 0.85rem;
          font-weight: 400;
          border-bottom: none;
        }
        .site-btn:hover {
          color: #d4af37;
          background: none;
        }
        .logout-link {
          color: #8a7e6a;
          font-size: 0.85rem;
          font-weight: 400;
          border-bottom: none;
        }
        .logout-link:hover {
          color: #cf6b5e;
          background: none;
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
