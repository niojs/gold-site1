'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/stats', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { router.push('/'); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="dash-spinner" />
      <style jsx>{`.dash-spinner { width: 40px; height: 40px; border: 3px solid rgba(212,175,55,0.2); border-top-color: #d4af37; border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!stats) return null;

  const { totals, primaryBySite, drillingBySite, washingBySite, assayBySite, usersByRole } = stats;
  const drillPercent = totals.drilling > 0 ? Math.round((totals.drilled / totals.drilling) * 100) : 0;

  return (
    <div className="dash">
      <h1 className="dash-title">Панель управления</h1>
      <p className="dash-sub">Обзор всех данных по участкам</p>

      {/* Summary Cards */}
      <div className="dash-grid">
        <div className="dash-card accent">
          <div className="dash-card-icon">📐</div>
          <div className="dash-card-body">
            <span className="dash-card-value">{totals.primary}</span>
            <span className="dash-card-label">Первичных скважин</span>
          </div>
        </div>
        <div className="dash-card accent">
          <div className="dash-card-icon">⛏️</div>
          <div className="dash-card-body">
            <span className="dash-card-value">{totals.drilled}/{totals.drilling}</span>
            <span className="dash-card-label">Пробурено</span>
          </div>
        </div>
        <div className="dash-card accent">
          <div className="dash-card-icon">📝</div>
          <div className="dash-card-body">
            <span className="dash-card-value">{totals.field}</span>
            <span className="dash-card-label">Полевых записей</span>
          </div>
        </div>
        <div className="dash-card accent">
          <div className="dash-card-icon">🧪</div>
          <div className="dash-card-body">
            <span className="dash-card-value">{totals.washing}</span>
            <span className="dash-card-label">Промывок</span>
          </div>
        </div>
        <div className="dash-card accent">
          <div className="dash-card-icon">⚗️</div>
          <div className="dash-card-body">
            <span className="dash-card-value">{totals.assay}</span>
            <span className="dash-card-label">Анализов</span>
          </div>
        </div>
        <div className="dash-card accent">
          <div className="dash-card-icon">🗺️</div>
          <div className="dash-card-body">
            <span className="dash-card-value">{totals.sites}</span>
            <span className="dash-card-label">Участков</span>
          </div>
        </div>
      </div>

      {/* Drilling Progress */}
      <div className="dash-section">
        <h2 className="dash-section-title">Прогресс буровых работ</h2>
        <div className="dash-progress-wrap">
          <div className="dash-progress-bar">
            <div className="dash-progress-fill" style={{ width: `${drillPercent}%` }} />
          </div>
          <span className="dash-progress-text">{drillPercent}% ({totals.drilled} из {totals.drilling})</span>
        </div>
        <div className="dash-site-bars">
          {Object.entries(drillingBySite).map(([site, data]) => {
            const pct = data.total > 0 ? Math.round((data.drilled / data.total) * 100) : 0;
            return (
              <div key={site} className="dash-site-bar">
                <div className="dash-site-bar-header">
                  <span className="dash-site-bar-name">{site}</span>
                  <span className="dash-site-bar-value">{data.drilled}/{data.total} ({pct}%)</span>
                </div>
                <div className="dash-mini-bar">
                  <div className="dash-mini-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats by Site */}
      <div className="dash-section">
        <h2 className="dash-section-title">Статистика по участкам</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Участок</th>
                <th>Скважин</th>
                <th>Промывок</th>
                <th>Масса (кг)</th>
                <th>Объём (л)</th>
                <th>Анализов</th>
                <th>Ср. запасы (т)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys({ ...primaryBySite, ...washingBySite, ...assayBySite }).map(site => (
                <tr key={site}>
                  <td className="dash-td-site">{site}</td>
                  <td>{primaryBySite[site] || 0}</td>
                  <td>{washingBySite[site]?.count || 0}</td>
                  <td>{(washingBySite[site]?.mass || 0).toFixed(1)}</td>
                  <td>{(washingBySite[site]?.volume || 0).toFixed(1)}</td>
                  <td>{assayBySite[site]?.count || 0}</td>
                  <td>{(assayBySite[site]?.avgReserves || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team */}
      <div className="dash-section">
        <h2 className="dash-section-title">Команда</h2>
        <div className="dash-team">
          {Object.entries(usersByRole).map(([role, count]) => {
            const roleLabels = {
              admin: 'Администраторы',
              chief_geologist: 'Главные геологи',
              field_geologist: 'Полевые геологи',
              driller: 'Бурильщики',
              washer: 'Промывка',
              sampler: 'Пробы',
            };
            const roleIcons = {
              admin: '👑',
              chief_geologist: '🔬',
              field_geologist: '📝',
              driller: '⛏️',
              washer: '🧪',
              sampler: '⚗️',
            };
            return (
              <div key={role} className="dash-team-card">
                <span className="dash-team-icon">{roleIcons[role] || '👤'}</span>
                <span className="dash-team-count">{count}</span>
                <span className="dash-team-role">{roleLabels[role] || role}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="dash-section">
        <h2 className="dash-section-title">Быстрый доступ</h2>
        <div className="dash-links">
          <Link href="/primary-data" className="dash-link">📐 Первичные данные</Link>
          <Link href="/table" className="dash-link">📋 Все данные</Link>
          <Link href="/map" className="dash-link">🗺️ Карта</Link>
          <Link href="/import-export" className="dash-link">📤 Импорт/Экспорт</Link>
        </div>
      </div>

      <style jsx>{`
        .dash {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .dash-title {
          color: #d4af37;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 0 0.3rem;
        }
        .dash-sub {
          color: #7a7060;
          font-size: 0.9rem;
          margin: 0 0 2rem;
        }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .dash-card {
          background: linear-gradient(160deg, #1a1712, #111);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 14px;
          padding: 1.2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .dash-card:hover {
          border-color: rgba(212,175,55,0.35);
          transform: translateY(-2px);
        }
        .dash-card-icon {
          font-size: 1.8rem;
          background: rgba(212,175,55,0.08);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .dash-card-body {
          display: flex;
          flex-direction: column;
        }
        .dash-card-value {
          color: #d4af37;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.1;
        }
        .dash-card-label {
          color: #7a7060;
          font-size: 0.78rem;
          margin-top: 0.2rem;
        }

        .dash-section {
          margin-bottom: 2rem;
        }
        .dash-section-title {
          color: #d4af37;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(212,175,55,0.15);
        }

        .dash-progress-wrap {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.2rem;
        }
        .dash-progress-bar {
          flex: 1;
          height: 10px;
          background: #1a1712;
          border-radius: 5px;
          overflow: hidden;
        }
        .dash-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #d4af37, #f0d060);
          border-radius: 5px;
          transition: width 0.6s ease;
        }
        .dash-progress-text {
          color: #c0b89a;
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .dash-site-bars {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .dash-site-bar-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.3rem;
        }
        .dash-site-bar-name {
          color: #c0b89a;
          font-size: 0.85rem;
        }
        .dash-site-bar-value {
          color: #8a7e6a;
          font-size: 0.8rem;
        }
        .dash-mini-bar {
          height: 6px;
          background: #1a1712;
          border-radius: 3px;
          overflow: hidden;
        }
        .dash-mini-fill {
          height: 100%;
          background: linear-gradient(90deg, #d4af37, #c9a227);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .dash-table-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid rgba(212,175,55,0.12);
        }
        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .dash-table th {
          background: #1a1712;
          color: #d4af37;
          padding: 0.7rem 1rem;
          text-align: left;
          font-weight: 600;
          white-space: nowrap;
        }
        .dash-table td {
          padding: 0.6rem 1rem;
          color: #c0b89a;
          border-top: 1px solid rgba(212,175,55,0.08);
        }
        .dash-table tr:hover td {
          background: rgba(212,175,55,0.03);
        }
        .dash-td-site {
          color: #d4af37;
          font-weight: 600;
        }

        .dash-team {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .dash-team-card {
          background: linear-gradient(160deg, #1a1712, #111);
          border: 1px solid rgba(212,175,55,0.12);
          border-radius: 12px;
          padding: 1rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          transition: border-color 0.2s;
        }
        .dash-team-card:hover {
          border-color: rgba(212,175,55,0.3);
        }
        .dash-team-icon { font-size: 1.3rem; }
        .dash-team-count {
          color: #d4af37;
          font-size: 1.3rem;
          font-weight: 700;
        }
        .dash-team-role {
          color: #8a7e6a;
          font-size: 0.82rem;
        }

        .dash-links {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }
        .dash-link {
          background: linear-gradient(160deg, #1a1712, #111);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 10px;
          padding: 0.8rem 1.4rem;
          color: #c0b89a;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .dash-link:hover {
          border-color: #d4af37;
          color: #d4af37;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
