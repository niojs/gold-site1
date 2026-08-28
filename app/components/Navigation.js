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
        if (data.role) setUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const getMenuItems = () => {
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
      driller: [],
      washer: [{ href: '/washing', label: '🧪 Отдел промывки' }],
      sampler: [{ href: '/assay', label: '⚗️ Отдел проб' }],
    };

    if (!userRole) return [{ href: '/', label: '🔑 Войти' }];
    return roleSpecific[userRole] || [];
  };

  const menuItems = getMenuItems();
  const isSinglePageRole = ['driller', 'washer', 'sampler'].includes(userRole);
  const hasMenuItems = menuItems.length > 0;

  return (
    <nav className="nav-bar">
      <div className="nav-top">
        <Link href={userRole ? '/map' : '/'} className="logo-link">
          <span className="logo-icon">⚒️</span>
          <span className="logo-text">Gold Manager</span>
        </Link>

        <div className="nav-right">
          {isSinglePageRole && (
            <button onClick={handleLogout} className="logout-solo">
              Выйти
            </button>
          )}
          {hasMenuItems && !isSinglePageRole && (
            <button onClick={() => setMenuOpen(!menuOpen)} className="burger-btn">
              ☰
            </button>
          )}
        </div>
      </div>

      {hasMenuItems && !isSinglePageRole && (
        <div className={`menu-links ${menuOpen ? 'open' : ''}`}>
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              <span className={pathname === item.href ? 'link active' : 'link'}>
                {item.label}
              </span>
            </Link>
          ))}
          {userRole && (
            <button onClick={handleLogout} className="logout-btn">
              Выйти
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .nav-bar {
          background: transparent;
          padding: 1.2rem 1.5rem;
          position: relative;
          z-index: 1000;
        }
        .nav-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ===== ЛОГО ===== */
        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .logo-link:hover {
          opacity: 0.8;
        }
        .logo-icon {
          font-size: 1.5rem;
          opacity: 0.95;
        }
        .logo-text {
          font-size: 1.35rem;
          font-weight: 600;
          color: #d4af37;
          letter-spacing: 0.5px;
        }

        /* ===== ПРАВАЯ ЧАСТЬ ===== */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        /* ===== КНОПКА "ВЫЙТИ" (одностраничные роли) ===== */
        .logout-solo {
          background: transparent;
          color: #999;
          border: none;
          padding: 0.4rem 0.6rem;
          font-weight: 500;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .logout-solo:hover {
          color: #d4af37;
        }

        /* ===== БУРГЕР ===== */
        .burger-btn {
          display: none;
          background: none;
          border: none;
          color: #d4af37;
          font-size: 1.6rem;
          cursor: pointer;
          padding: 0.2rem 0.4rem;
          line-height: 1;
        }

        /* ===== МЕНЮ ===== */
        .menu-links {
          display: flex;
          gap: 1.3rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .link {
          color: #999;
          padding: 0.3rem 0;
          cursor: pointer;
          font-size: 0.92rem;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .link.active {
          color: #d4af37;
          font-weight: 500;
        }
        .link:hover {
          color: #d4af37;
        }
        .logout-btn {
          background: none;
          border: none;
          color: #999;
          padding: 0.3rem 0.4rem;
          cursor: pointer;
          font-size: 0.92rem;
          transition: color 0.2s;
        }
        .logout-btn:hover {
          color: #d4af37;
        }

        /* ===== ДЕСКТОП ===== */
        @media (min-width: 769px) {
          .nav-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
          }
          .nav-top {
            flex: none;
          }
        }

        /* ===== МОБИЛЬНАЯ ВЕРСИЯ ===== */
        @media (max-width: 768px) {
          .burger-btn {
            display: block;
          }
          .menu-links {
            display: none;
            flex-direction: column;
            width: 100%;
            gap: 0.2rem;
            padding-top: 1rem;
            margin-top: 1rem;
            border-top: 1px solid rgba(212, 175, 55, 0.15);
          }
          .menu-links.open {
            display: flex;
          }
          .menu-links .link {
            display: block;
            width: 100%;
            padding: 0.7rem 0;
          }
          .logout-btn {
            width: 100%;
            text-align: left;
            padding: 0.7rem 0;
          }
        }
      `}</style>
    </nav>
  );
}