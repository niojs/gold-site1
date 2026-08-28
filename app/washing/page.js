'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WashingPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    holeNumber: '',
    interval: '',
    mass: '',
    volume: '',
    visualDescription: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/washing', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) router.push('/');
        return;
      }
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { ...form, id: editingId } : form;

    try {
      const res = await fetch('/api/washing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка сохранения');
        return;
      }

      setForm({ holeNumber: '', interval: '', mass: '', volume: '', visualDescription: '' });
      setEditingId(null);
      fetchRecords();
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setForm({
      holeNumber: record.hole_number || '',
      interval: record.interval || '',
      mass: record.mass || '',
      volume: record.volume || '',
      visualDescription: record.visual_description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить запись?')) return;

    try {
      const res = await fetch('/api/washing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка удаления');
        return;
      }

      fetchRecords();
    } catch (err) {
      setError('Ошибка соединения');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ holeNumber: '', interval: '', mass: '', volume: '', visualDescription: '' });
  };

  return (
    <div className="washing-page">
      <h1 className="page-title">Отдел промывки</h1>

      {error && <div className="error-box">{error}</div>}

      {/* ===== ФОРМА ===== */}
      <div className="card">
        <h2 className="card-title">{editingId ? 'Редактировать запись' : 'Новая запись'}</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Номер скважины *</label>
            <input
              placeholder="Например: 12-А"
              value={form.holeNumber}
              onChange={(e) => setForm({ ...form, holeNumber: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Интервал *</label>
            <input
              placeholder="Например: 0-2 м"
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Масса (кг) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.mass}
              onChange={(e) => setForm({ ...form, mass: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Объём (л) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.volume}
              onChange={(e) => setForm({ ...form, volume: e.target.value })}
              required
            />
          </div>

          <div className="field full">
            <label>Визуальное определение</label>
            <input
              placeholder="Описание (необязательно)"
              value={form.visualDescription}
              onChange={(e) => setForm({ ...form, visualDescription: e.target.value })}
            />
          </div>

          <div className="form-actions full">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : editingId ? 'Обновить' : 'Сохранить'}
            </button>
            {editingId && (
              <button className="btn-secondary" type="button" onClick={handleCancel}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ===== ЗАПИСИ ===== */}
      <div className="card">
        <h2 className="card-title">Мои записи</h2>

        {records.length === 0 ? (
          <p className="empty">Нет записей</p>
        ) : (
          <div className="records-list">
            {records.map((rec) => (
              <div className="record" key={rec.id}>
                <div className="record-main">
                  <div className="record-hole">Скв. {rec.hole_number}</div>
                  <div className="record-actions">
                    <button onClick={() => handleEdit(rec)} className="icon-btn edit">✏️</button>
                    <button onClick={() => handleDelete(rec.id)} className="icon-btn del">🗑️</button>
                  </div>
                </div>
                <div className="record-grid">
                  <div><span>Интервал:</span> {rec.interval}</div>
                  <div><span>Масса:</span> {rec.mass} кг</div>
                  <div><span>Объём:</span> {rec.volume} л</div>
                </div>
                {rec.visual_description && (
                  <div className="record-desc">
                    <span>Визуально:</span> {rec.visual_description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .washing-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .page-title {
          color: #d4af37;
          font-size: 1.7rem;
          font-weight: 600;
          margin-bottom: 1.8rem;
          letter-spacing: 0.5px;
        }

        /* ===== КАРТОЧКА ===== */
        .card {
          background: rgba(20, 18, 15, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .card-title {
          color: #d4af37;
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 1.3rem;
        }

        /* ===== ФОРМА ===== */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .field.full {
          grid-column: 1 / -1;
        }
        .field label {
          color: #a89a7e;
          font-size: 0.78rem;
          letter-spacing: 0.3px;
          padding-left: 0.2rem;
        }
        .field input {
          background: rgba(10, 10, 10, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.8rem 0.9rem;
          color: #e0dcc8;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          width: 100%;
        }
        .field input::placeholder {
          color: #555;
        }
        .field input:focus {
          outline: none;
          border-color: #d4af37;
          background: rgba(10, 10, 10, 0.7);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        /* ===== КНОПКИ ФОРМЫ ===== */
        .form-actions {
          display: flex;
          gap: 0.8rem;
          margin-top: 0.3rem;
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
          transition: all 0.2s ease;
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
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          color: #d4af37;
          border-color: #d4af37;
        }

        /* ===== ОШИБКА ===== */
        .error-box {
          background: rgba(207, 107, 94, 0.12);
          border: 1px solid rgba(207, 107, 94, 0.4);
          color: #cf6b5e;
          padding: 0.9rem 1.2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        /* ===== ЗАПИСИ (карточки) ===== */
        .empty {
          color: #8a7e6a;
          text-align: center;
          padding: 1.5rem 0;
        }
        .records-list {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .record {
          background: rgba(10, 10, 10, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1rem 1.1rem;
        }
        .record-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.7rem;
        }
        .record-hole {
          color: #d4af37;
          font-size: 1.05rem;
          font-weight: 600;
        }
        .record-actions {
          display: flex;
          gap: 0.3rem;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.15rem;
          padding: 0.2rem 0.4rem;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .record-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #ddd;
        }
        .record-grid span {
          color: #8a7e6a;
          font-size: 0.8rem;
          display: block;
        }
        .record-desc {
          margin-top: 0.7rem;
          padding-top: 0.7rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.9rem;
          color: #ddd;
        }
        .record-desc span {
          color: #8a7e6a;
        }

        /* ===== МОБИЛЬНАЯ ВЕРСИЯ ===== */
        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .form-actions {
            flex-direction: column;
          }
          .record-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}