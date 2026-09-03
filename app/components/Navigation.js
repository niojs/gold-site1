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
    document.cookie = 'selected_site=; path=/; max-age=0';
    router.push('/');
  };

  const handleChangeSite = () => {
    router.push('/select-site');
  };

  const getMenuItems = () => {
    const roleSpecific = {
      admin: [
        { href: '/primary-data', label: '📐 Первичные данные' },
        { href: '/admin/users', label: '👥 Пользователи' },
        { href: '/table', label: '📋 Все данные' },
        { href: '/map', label: '🗺️ Карта' },
        { href: '/import-export', label: '📤 Импорт/Экспорт' },
      ],
      chief_geologist: [
        { href: '/primary-data', label: '📐 Первичные данные' },
        { href: '/table', label: '📋 Все рабочие данные' },
        { href: '/map', label: '🗺️ Карта' },
        { href: '/import-export', label: '📤 Импорт/Экспорт' },
      ],
      field_geologist: [
        { href: '/field-data', label: '📝 Полевые данные' },
        { href: '/map', label: '🗺️ Карта' },
      ],
      driller: [
        { href: '/drilling', label: '⛏️ Буровые работы' },
        { href: '/map', label: '🗺️ Карта' },
      ],
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
      <div className="nav-content">
        <Link href={userRole ? (userRole === 'admin' || userRole === 'chief_geologist' ? '/primary-data' : '/map') : '/'} className="logo-link">
          <span className="logo-icon">⚒️</span>
          <span className="logo-text">Gold Manager</span>
        </Link>

        {isSinglePageRole && (
          <div className="nav-actions">
            <button onClick={handleChangeSite} className="nav-btn site-btn">
              <span className="nav-btn-icon">🗺️</span>
              <span>Участок</span>
            </button>
            <button onClick={handleLogout} className="nav-btn logout-btn">
              Выйти
            </button>
          </div>
        )}

        {hasMenuItems && !isSinglePageRole && (
          <div className="nav-actions">
            <div className="menu-links">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  <span className={pathname === item.href ? 'link active' : 'link'}>
                    {item.label}
                  </span>
                </Link>
              ))}
              <button onClick={handleChangeSite} className="link site-link">
                🗺️ Сменить участок
              </button>
              <button onClick={handleLogout} className="nav-btn logout-btn">
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .nav-bar {
          background: transparent;
          padding: 1rem 1.5rem;
          position: relative;
          z-index: 1000;
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          text-decoration: none;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }
        .logo-link:hover { opacity: 0.8; }
        .logo-icon { font-size: 1.5rem; }
        .logo-text {
          font-size: 1.35rem;
          font-weight: 600;
          color: #d4af37;
          letter-spacing: 0.5px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          border: 1px solid rgba(212,175,55,0.3);
          color: #d4af37;
          padding: 0.45rem 1rem;
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-btn:hover {
          background: rgba(212,175,55,0.1);
          border-color: #d4af37;
        }
        .nav-btn-icon { font-size: 0.9rem; }

        .logout-btn {
          color: #999;
          border-color: rgba(153,153,153,0.2);
        }
        .logout-btn:hover {
          color: #d4af37;
          border-color: rgba(212,175,55,0.3);
          background: rgba(212,175,55,0.05);
        }

        .menu-links {
          display: flex;
          gap: 1.2rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .link {
          color: #999;
          padding: 0.3rem 0;
          cursor: pointer;
          font-size: 0.92rem;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .link.active { color: #d4af37; font-weight: 500; }
        .link:hover { color: #d4af37; }
        .site-link {
          background: none;
          border: none;
          font-size: 0.92rem;
        }

        @media (max-width: 768px) {
          .nav-content {
            flex-wrap: wrap;
            gap: 0.8rem;
          }
          .menu-links {
            display: ${menuOpen ? 'flex' : 'none'};
            flex-direction: column;
            width: 100%;
            gap: 0.2rem;
            padding-top: 0.8rem;
            border-top: 1px solid rgba(212, 175, 55, 0.15);
          }
          .menu-links .link {
            display: block;
            width: 100%;
            padding: 0.6rem 0;
          }
        }
      `}</style>
    </nav>
  );
}