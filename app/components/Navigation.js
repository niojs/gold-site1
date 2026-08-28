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
  const isDriller = userRole === 'driller';
  const hasMenuItems = menuItems.length > 0;

  return (
    <nav className="nav-bar">
      <div className="nav-top">
        {/* ЛОГО */}
        <Link href={userRole ? '/map' : '/'} className="logo-link">
          <span className="logo-icon">⚒️</span>
          <span className="logo-text">Gold Manager</span>
        </Link>

        <div className="nav-right">
          {/* Кнопка "Выйти" для буровика */}
          {isDriller && (
            <button onClick={handleLogout} className="logout-solo">
              Выйти
            </button>
          )}

          {/* Бургер — если есть пункты */}
          {hasMenuItems && (
            <button onClick={() => setMenuOpen(!menuOpen)} className="burger-btn">
              ☰
            </button>
          )}
        </div>
      </div>

      {/* Меню для остальных ролей */}
      {hasMenuItems && (
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
          background: rgba(13, 13, 13, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 0.9rem 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.25);
          position: sticky;
          top: 0;
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
          gap: 0.6rem;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .logo-link:hover {
          opacity: 0.85;
        }
        .logo-icon {
          font-size: 1.6rem;
        }
        .logo-text {
          font-size: 1.4rem;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.3px;
          text-decoration: none;
        }

        /* ===== ПРАВАЯ ЧАСТЬ ===== */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        /* ===== КНОПКА "ВЫЙТИ" БУРОВИКА ===== */
        .logout-solo {
          background: transparent;
          color: #d4af37;
          border: 1.5px solid #d4af37;
          padding: 0.55rem 1.3rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .logout-solo:hover {
          background: #d4af37;
          color: #0d0d0d;
        }

        /* ===== БУРГЕР ===== */
        .burger-btn {
          display: none;
          background: none;
          border: none;
          color: #d4af37;
          font-size: 1.7rem;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          line-height: 1;
        }

        /* ===== МЕНЮ ===== */
        .menu-links {
          display: flex;
          gap: 1.2rem;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 0;
        }
        .link {
          color: #cccccc;
          padding: 0.4rem 0.2rem;
          cursor: pointer;
          font-size: 0.95rem;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .link.active {
          color: #d4af37;
          font-weight: 600;
          border-bottom: 2px solid #d4af37;
        }
        .link:hover {
          color: #f0d060;
        }
        .logout-btn {
          background: none;
          border: 1px solid #a67c6b;
          color: #a67c6b;
          padding: 0.35rem 0.9rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: 0.2s;
        }
        .logout-btn:hover {
          background: #a67c6b;
          color: #0d0d0d;
        }

        /* ===== ДЕСКТОП: меню в одну строку с лого ===== */
        @media (min-width: 769px) {
          .nav-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .nav-top {
            flex: none;
          }
          .menu-links {
            margin-top: 0;
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
            gap: 0.4rem;
            padding-top: 0.8rem;
            border-top: 1px solid #333;
            margin-top: 0.8rem;
          }
          .menu-links.open {
            display: flex;
          }
          .menu-links .link {
            display: block;
            width: 100%;
            padding: 0.6rem 0;
            border-bottom: 1px solid #2a2a2a;
          }
          .logout-btn {
            width: 100%;
            padding: 0.7rem 0;
            margin-top: 0.4rem;
          }
        }
      `}</style>
    </nav>
  );
}