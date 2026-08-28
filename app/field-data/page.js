'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FieldDataPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    holeNumber: '',
    coordinates: '',
    lineHeight: '',
    intervals: '',
    geologicalDescription: '',
    ugv: '',
    date: '',
    time: '',
    site: '',
    diameter: '',
    coreRecovery: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const emptyForm = {
    holeNumber: '',
    coordinates: '',
    lineHeight: '',
    intervals: '',
    geologicalDescription: '',
    ugv: '',
    date: '',
    time: '',
    site: '',
    diameter: '',
    coreRecovery: '',
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/field-data', { credentials: 'include' });
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
      const res = await fetch('/api/field-data', {
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

      setForm(emptyForm);
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
      coordinates: record.coordinates || '',
      lineHeight: record.line_height || '',
      intervals: record.intervals || '',
      geologicalDescription: record.geological_description || '',
      ugv: record.ugv || '',
      date: record.date || '',
      time: record.time || '',
      site: record.site || '',
      diameter: record.diameter || '',
      coreRecovery: record.core_recovery || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить запись?')) return;

    try {
      const res = await fetch('/api/field-data', {
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
    setForm(emptyForm);
  };

  return (
    <div className="field-page">
      <h1 className="page-title">Полевые данные</h1>

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
            <label>Координаты *</label>
            <input
              placeholder="55.7500, 60.0000"
              value={form.coordinates}
              onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Линия / высота</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.lineHeight}
              onChange={(e) => setForm({ ...form, lineHeight: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Интервалы</label>
            <input
              placeholder="Например: 0-2 м"
              value={form.intervals}
              onChange={(e) => setForm({ ...form, intervals: e.target.value })}
            />
          </div>

          <div className="field full">
            <label>Геологическое описание</label>
            <input
              placeholder="Описание породы"
              value={form.geologicalDescription}
              onChange={(e) => setForm({ ...form, geologicalDescription: e.target.value })}
            />
          </div>

          <div className="field">
            <label>УГВ (м)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.ugv}
              onChange={(e) => setForm({ ...form, ugv: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Участок работ *</label>
            <input
              placeholder="Название участка"
              value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label>Дата</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Время</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Диаметр бурения (мм)</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={form.diameter}
              onChange={(e) => setForm({ ...form, diameter: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Выход керна (%)</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={form.coreRecovery}
              onChange={(e) => setForm({ ...form, coreRecovery: e.target.value })}
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
                  <div><span>Участок:</span> {rec.site || '—'}</div>
                  <div><span>Координаты:</span> {rec.coordinates || '—'}</div>
                  <div><span>Дата:</span> {rec.date ? new Date(rec.date).toLocaleDateString() : '—'}</div>
                  <div><span>Время:</span> {rec.time || '—'}</div>
                  {rec.intervals && <div><span>Интервалы:</span> {rec.intervals}</div>}
                  {rec.ugv && <div><span>УГВ:</span> {rec.ugv} м</div>}
                  {rec.diameter && <div><span>Диаметр:</span> {rec.diameter} мм</div>}
                  {rec.core_recovery && <div><span>Выход керна:</span> {rec.core_recovery}%</div>}
                </div>
                {rec.geological_description && (
                  <div className="record-desc">
                    <span>Геология:</span> {rec.geological_description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .field-page {
          max-width: 760px;
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
        /* дата/время — чтобы иконка календаря была видна */
        .field input[type='date'],
        .field input[type='time'] {
          color-scheme: dark;
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
          grid-template-columns: 1fr 1fr;
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