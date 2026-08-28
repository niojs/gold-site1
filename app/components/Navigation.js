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
      {/* ЛОГО */}
      <Link href={userRole ? '/map' : '/'} className="logo-link">
        <div className="logo">
          <span className="logo-icon">⚒️</span>
          <span className="logo-text">Gold Manager</span>
        </div>
      </Link>

      {/* Бургер — только если есть пункты меню */}
      {hasMenuItems && (
        <button onClick={() => setMenuOpen(!menuOpen)} className="burger-btn">
          ☰
        </button>
      )}

      {/* Кнопка "Выйти" для буровика — всегда видна справа */}
      {isDriller && (
        <button onClick={handleLogout} className="logout-solo">
          🚪 Выйти
        </button>
      )}

      {/* Обычное меню (для остальных ролей) */}
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
          background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
          padding: 0.8rem 1.5rem;
          border-bottom: 1px solid #d4af37;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        /* ===== ЛОГО ===== */
        .logo-link {
          text-decoration: none;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        .logo:hover {
          transform: scale(1.05);
        }
        .logo-icon {
          font-size: 1.8rem;
          filter: drop-shadow(0 0 8px rgba(212,175,55,0.6));
          animation: iconPulse 2.5s ease-in-out infinite;
        }
        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          background: linear-gradient(
            90deg,
            #d4af37 0%,
            #f9e79f 25%,
            #d4af37 50%,
            #f9e79f 75%,
            #d4af37 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 3s linear infinite;
          text-shadow: 0 0 20px rgba(212,175,55,0.3);
        }

        @keyframes shine {
          to { background-position: 200% center; }
        }
        @keyframes iconPulse {
          0%, 100% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 8px rgba(212,175,55,0.6)); }
          50% { transform: rotate(-8deg) scale(1.1); filter: drop-shadow(0 0 14px rgba(212,175,55,0.9)); }
        }

        /* ===== БУРГЕР ===== */
        .burger-btn {
          display: none;
          background: none;
          border: none;
          color: #d4af37;
          font-size: 1.8rem;
          cursor: pointer;
          padding: 0.3rem 0.8rem;
        }

        /* ===== КНОПКА "ВЫЙТИ" БУРОВИКА ===== */
        .logout-solo {
          background: linear-gradient(135deg, #2a1a1a, #3a2020);
          color: #f0d060;
          border: 1.5px solid #d4af37;
          padding: 0.6rem 1.4rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 0 rgba(212,175,55,0);
          position: relative;
          overflow: hidden;
        }
        .logout-solo::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);
          transition: left 0.5s;
        }
        .logout-solo:hover {
          background: linear-gradient(135deg, #d4af37, #f0d060);
          color: #0d0d0d;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212,175,55,0.5);
        }
        .logout-solo:hover::before {
          left: 100%;
        }
        .logout-solo:active {
          transform: translateY(0);
        }

        /* ===== МЕНЮ ===== */
        .menu-links {
          display: flex;
          gap: 1.2rem;
          flex-wrap: wrap;
          align-items: center;
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
          font-weight: bold;
          border-bottom: 2px solid #d4af37;
        }
        .link:hover {
          color: #f0d060;
        }
        .logout-btn {
          background: none;
          border: 1px solid #a67c6b;
          color: #a67c6b;
          padding: 0.3rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: 0.2s;
        }
        .logout-btn:hover {
          background: #a67c6b;
          color: #0d0d0d;
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
            gap: 0.6rem;
            padding-top: 0.8rem;
            border-top: 1px solid #333;
            margin-top: 0.5rem;
          }
          .menu-links.open {
            display: flex;
          }
          .menu-links .link {
            display: block;
            width: 100%;
            padding: 0.5rem 0;
            border-bottom: 1px solid #2a2a2a;
          }
          .logout-btn {
            width: 100%;
            padding: 0.6rem 0;
          }
        }
      `}</style>
    </nav>
  );
}