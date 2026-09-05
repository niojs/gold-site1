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
    const items = roleSpecific[userRole] || [];
    return [...items, { href: '/profile', label: 'Профиль' }];
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
          background: linear-gradient(180deg, #161107 0%, #0d0b08 100%);
          border-bottom: none;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.55);
        }
        .nav-bar::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 2%, rgba(212, 175, 55, 0.55) 30%, rgba(240, 208, 96, 0.8) 50%, rgba(212, 175, 55, 0.55) 70%, transparent 98%);
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
        .logo-icon {
          font-size: 1.25rem;
          filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.65));
          transition: transform 0.25s ease;
        }
        .logo-link:hover .logo-icon {
          transform: rotate(-12deg) scale(1.08);
        }
        .logo-text {
          font-size: 1.08rem;
          font-weight: 800;
          letter-spacing: 0.4px;
          white-space: nowrap;
          background: linear-gradient(135deg, #f0d060 0%, #d4af37 55%, #a8821f 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: #d4af37;
          text-shadow: 0 0 24px rgba(212, 175, 55, 0.25);
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
          position: relative;
          color: #d8d1bd;
          padding: 0.45rem 0.15rem;
          margin-right: 0;
          font-size: 0.93rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          white-space: nowrap;
          flex-shrink: 0;
          border-radius: 0;
          text-decoration: none;
          transition: color 0.2s ease, text-shadow 0.2s ease;
          cursor: pointer;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-family: inherit;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 100%;
          bottom: -2px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #d4af37, #f0d060);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.7);
          transition: right 0.25s ease;
        }
        .nav-link:hover {
          color: #f0d060;
          background: none;
          text-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
        }
        .nav-link:hover::after {
          right: 0;
        }
        .nav-link.active {
          color: #f0d060;
          background: none;
          font-weight: 600;
          border-bottom-color: transparent;
          text-shadow: 0 0 12px rgba(212, 175, 55, 0.45);
        }
        .nav-link.active::after {
          right: 0;
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
          letter-spacing: 0.2px;
          border-bottom: none;
        }
        .site-btn::after,
        .logout-link::after {
          display: none;
        }
        .site-btn:hover {
          color: #d4af37;
          background: none;
          text-shadow: none;
        }
        .logout-link {
          color: #8a7e6a;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.2px;
          border-bottom: none;
        }
        .logout-link:hover {
          color: #cf6b5e;
          background: none;
          text-shadow: none;
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
