'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AllDataPage() {
  const [data, setData] = useState({ drilling: [], field: [], washing: [], assay: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/table/all', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/');
        return;
      }
      setData(await res.json());
    } catch {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleDelete = async (type, id) => {
    if (!confirm('Удалить запись?')) return;
    try {
      const res = await fetch('/api/table/all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
        credentials: 'include',
      });
      if (!res.ok) { setError((await res.json()).error || 'Ошибка удаления'); return; }
      fetchAllData();
    } catch { setError('Ошибка соединения'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/table/all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: editing.type, record: editing.record }),
        credentials: 'include',
      });
      if (!res.ok) { setError((await res.json()).error || 'Ошибка сохранения'); return; }
      setEditing(null);
      fetchAllData();
    } catch { setError('Ошибка соединения'); } finally { setSaving(false); }
  };

  const updateField = (key, value) =>
    setEditing({ ...editing, record: { ...editing.record, [key]: value } });

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const fieldConfig = {
    drilling: [
      { key: 'site', label: 'Участок', type: 'text' },
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'hole_number', label: 'Скважина', type: 'text' },
      { key: 'diameter', label: 'Диаметр (мм)', type: 'number' },
      { key: 'start_time', label: 'Начало', type: 'time' },
      { key: 'end_time', label: 'Конец', type: 'time' },
    ],
    field: [
      { key: 'hole_number', label: 'Скважина', type: 'text' },
      { key: 'coordinates', label: 'Координаты', type: 'text' },
      { key: 'site', label: 'Участок', type: 'text' },
      { key: 'line_height', label: 'Линия/высота', type: 'number' },
      { key: 'intervals', label: 'Интервалы', type: 'text' },
      { key: 'geological_description', label: 'Геологическое описание', type: 'text' },
      { key: 'ugv', label: 'УГВ (м)', type: 'number' },
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'time', label: 'Время', type: 'time' },
      { key: 'diameter', label: 'Диаметр (мм)', type: 'number' },
      { key: 'core_recovery', label: 'Выход керна (%)', type: 'number' },
    ],
    washing: [
      { key: 'hole_number', label: 'Скважина', type: 'text' },
      { key: 'interval', label: 'Интервал', type: 'text' },
      { key: 'mass', label: 'Масса', type: 'number' },
      { key: 'volume', label: 'Объём', type: 'number' },
      { key: 'visual_description', label: 'Визуальное описание', type: 'text' },
    ],
    assay: [
      { key: 'hole_number', label: 'Скважина', type: 'text' },
      { key: 'interval', label: 'Интервал', type: 'text' },
      { key: 'reserves', label: 'Запасы', type: 'number' },
      { key: 'marks', label: 'Отметки', type: 'text' },
      { key: 'sample_weight', label: 'Вес пробы', type: 'number' },
    ],
  };

  const sectionTitles = {
    drilling: 'Буровые работы',
    field: 'Полевые данные',
    washing: 'Отдел промывки',
    assay: 'Отдел проб',
  };

  const renderCard = (type, rec) => {
    const rows = {
      drilling: [
        ['Участок', rec.site],
        ['Дата', fmtDate(rec.date)],
        ['Диаметр', rec.diameter ? `${rec.diameter} мм` : '—'],
        ['Начало', rec.start_time || '—'],
        ['Конец', rec.end_time || '—'],
      ],
      field: [
        ['Координаты', rec.coordinates],
        ['Участок', rec.site],
        ['Дата', fmtDate(rec.date)],
        ['Время', rec.time || '—'],
        ['Интервалы', rec.intervals || '—'],
        ['УГВ', rec.ugv ? `${rec.ugv} м` : '—'],
        ['Диаметр', rec.diameter ? `${rec.diameter} мм` : '—'],
        ['Выход керна', rec.core_recovery ? `${rec.core_recovery}%` : '—'],
        ['Геоописание', rec.geological_description || '—'],
      ],
      washing: [
        ['Интервал', rec.interval],
        ['Масса', rec.mass],
        ['Объём', rec.volume],
        ['Описание', rec.visual_description || '—'],
      ],
      assay: [
        ['Интервал', rec.interval],
        ['Запасы', rec.reserves],
        ['Отметки', rec.marks || '—'],
        ['Вес пробы', rec.sample_weight],
      ],
    };

    return (
      <div className="record" key={rec.id}>
        <div className="record-head">
          <span className="record-hole">Скважина {rec.hole_number}</span>
          <div className="record-actions">
            <button className="edit-btn" onClick={() => setEditing({ type, record: { ...rec } })}>
              Изменить
            </button>
            <button className="del-btn" onClick={() => handleDelete(type, rec.id)}>
              Удалить
            </button>
          </div>
        </div>
        <div className="record-grid">
          {rows[type].map(([label, val]) => (
            <div className="cell" key={label}>
              <span className="cell-label">{label}</span>
              <span className="cell-value">{val ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="state-msg">Загрузка...</div>;

  return (
    <div className="all-data-page">
      <h1 className="page-title">Все данные</h1>

      {error && <div className="error-box">{error}</div>}

      {['drilling', 'field', 'washing', 'assay'].map((type) => (
        <div className="card" key={type}>
          <div className="card-head">
            <h2 className="card-title">{sectionTitles[type]}</h2>
            <span className="count">{data[type].length}</span>
          </div>
          {data[type].length === 0 ? (
            <p className="empty">Нет записей</p>
          ) : (
            <div className="records-list">
              {data[type].map((rec) => renderCard(type, rec))}
            </div>
          )}
        </div>
      ))}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Редактирование — {sectionTitles[editing.type]}</h2>
            <form onSubmit={handleSave} className="modal-form">
              {fieldConfig[editing.type].map((f) => (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    type={f.type}
                    step={f.type === 'number' ? '0.01' : undefined}
                    value={editing.record[f.key] ?? ''}
                    onChange={(e) => updateField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div className="modal-actions">
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .all-data-page {
          max-width: 820px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .page-title {
          color: #d4af37;
          font-size: 1.7rem;
          font-weight: 600;
          margin-bottom: 1.8rem;
        }
        .state-msg {
          text-align: center;
          padding: 2rem;
          color: #d4af37;
        }

        .card {
          background: rgba(20, 18, 15, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: 16px;
          padding: 1.4rem;
          margin-bottom: 1.5rem;
        }
        .card-head {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 1.2rem;
        }
        .card-title {
          color: #d4af37;
          font-size: 1.15rem;
          font-weight: 600;
        }
        .count {
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.15rem 0.6rem;
          border-radius: 20px;
        }
        .empty {
          color: #8a7e6a;
          text-align: center;
          padding: 1rem 0;
        }

        .records-list {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .record {
          background: rgba(10, 10, 10, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1rem 1.1rem;
        }
        .record-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.9rem;
          padding-bottom: 0.7rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .record-hole {
          color: #d4af37;
          font-size: 1.05rem;
          font-weight: 600;
        }
        .record-actions {
          display: flex;
          gap: 0.4rem;
        }
        .edit-btn, .del-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .edit-btn {
          color: #d4af37;
          border-color: rgba(212, 175, 55, 0.4);
        }
        .edit-btn:hover {
          background: rgba(212, 175, 55, 0.12);
        }
        .del-btn {
          color: #cf6b5e;
          border-color: rgba(207, 107, 94, 0.4);
        }
        .del-btn:hover {
          background: rgba(207, 107, 94, 0.12);
        }

        .record-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.7rem 1rem;
        }
        .cell {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .cell-label {
          color: #8a7e6a;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .cell-value {
          color: #e0dcc8;
          font-size: 0.92rem;
          word-break: break-word;
        }

        .error-box {
          background: rgba(207, 107, 94, 0.12);
          border: 1px solid rgba(207, 107, 94, 0.4);
          color: #cf6b5e;
          padding: 0.9rem 1.2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 2000;
        }
          .modal {
          background: #14120f;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 1.5rem;
          width: 100%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
        }
        .modal-title {
          color: #d4af37;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1.3rem;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .field label {
          color: #a89a7e;
          font-size: 0.78rem;
          padding-left: 0.2rem;
        }
        .field input {
          background: rgba(10, 10, 10, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.8rem 0.9rem;
          color: #e0dcc8;
          font-size: 0.95rem;
          width: 100%;
        }
        .field input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        .field input[type='date'],
        .field input[type='time'] {
          color-scheme: dark;
        }

        .modal-actions {
          display: flex;
          gap: 0.8rem;
          margin-top: 0.5rem;
        }
        .btn-primary {
          flex: 1;
          background: linear-gradient(135deg, #d4af37, #b8901f);
          color: #0a0a0a;
          border: none;
          border-radius: 10px;
          padding: 0.9rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(212, 175, 55, 0.3);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: transparent;
          color: #999;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 0.9rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          color: #d4af37;
          border-color: #d4af37;
        }

        @media (max-width: 480px) {
          .record-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}