'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AssayPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    holeNumber: '',
    interval: '',
    reserves: '',
    marks: '',
    sampleWeight: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/assay', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) router.push('/');
        return;
      }
      setRecords(await res.json());
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
      const res = await fetch('/api/assay', {
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

      setForm({ holeNumber: '', interval: '', reserves: '', marks: '', sampleWeight: '' });
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
      reserves: record.reserves || '',
      marks: record.marks || '',
      sampleWeight: record.sample_weight || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ holeNumber: '', interval: '', reserves: '', marks: '', sampleWeight: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить запись?')) return;
    try {
      const res = await fetch('/api/assay', {
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

  return (
    <div className="assay-page">
      <h1 className="page-title">Отдел проб</h1>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <h2 className="card-title">{editingId ? 'Редактировать запись' : 'Новая запись'}</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Номер скважины *</label>
            <input
              value={form.holeNumber}
              onChange={(e) => setForm({ ...form, holeNumber: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Интервал *</label>
            <input
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Запасы (т) *</label>
            <input
              type="number"
              step="0.01"
              value={form.reserves}
              onChange={(e) => setForm({ ...form, reserves: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Отметки</label>
            <input
              value={form.marks}
              onChange={(e) => setForm({ ...form, marks: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Вес пробы (кг) *</label>
            <input
              type="number"
              step="0.01"
              value={form.sampleWeight}
              onChange={(e) => setForm({ ...form, sampleWeight: e.target.value })}
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : editingId ? 'Обновить' : 'Сохранить'}
          </button>
          {editingId && (
            <button className="btn-secondary" type="button" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Мои записи</h2>
          <span className="count">{records.length}</span>
        </div>

        {records.length === 0 ? (
          <p className="empty">Нет записей</p>
        ) : (
          <div className="records-list">
            {records.map((rec) => (
              <div className="record" key={rec.id}>
                <div className="record-head">
                  <span className="record-hole">Скважина {rec.hole_number}</span>
                  <div className="record-actions">
                    <button className="edit-btn" onClick={() => handleEdit(rec)}>
                      Изменить
                    </button>
                    <button className="del-btn" onClick={() => handleDelete(rec.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
                <div className="record-grid">
                  <div className="cell">
                    <span className="cell-label">Интервал</span>
                    <span className="cell-value">{rec.interval}</span>
                  </div>
                  <div className="cell">
                    <span className="cell-label">Запасы</span>
                    <span className="cell-value">{rec.reserves} т</span>
                  </div>
                  <div className="cell">
                    <span className="cell-label">Вес пробы</span>
                    <span className="cell-value">{rec.sample_weight} кг</span>
                  </div>
                  <div className="cell">
                    <span className="cell-label">Отметки</span>
                    <span className="cell-value">{rec.marks || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .assay-page {
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

        .card {
          background: rgba(20, 18, 15, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: 16px;
          padding: 1.5rem;
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
          margin-bottom: 1.2rem;
        }
        .card-head .card-title {
          margin-bottom: 0;
        }
        .count {
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.15rem 0.6rem;
          border-radius: 20px;
        }

        .form {
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
          padding: 0.85rem 0.9rem;
          color: #e0dcc8;
          font-size: 0.95rem;
          width: 100%;
        }
        .field input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #d4af37, #b8901f);
          color: #0a0a0a;
          border: none;
          border-radius: 10px;
          padding: 0.95rem;
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
          padding: 0.85rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          color: #d4af37;
          border-color: #d4af37;
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
      `}</style>
    </div>
  );
}