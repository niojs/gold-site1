'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <p style={{ color: '#d4af37', textAlign: 'center', padding: '2rem' }}>Загрузка карты...</p>,
});

const emptyForm = {
  id: null,
  name: '',
  coordinates: '',
  type: 'drilling',
  layer: 'Скважина',
  holeNumber: '',
  date: '',
  site: '',
  diameter: '',
  startTime: '',
  endTime: '',
  queue: '1',
  isDrilled: false,
  projectCoordinates: '',
  trueCoordinates: '',
};

export default function MapPage() {
  const [points, setPoints] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const isEditing = form.id !== null;
  const isDrilling = form.type === 'drilling';

  const fetchPoints = async () => {
    try {
      const res = await fetch('/api/map/points', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setPoints(data.points || []);
      setCanEdit(data.currentUser?.canEdit || false);
    } catch (err) {
      console.error('Ошибка загрузки точек:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const openAddModal = () => {
    setForm(emptyForm);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (point) => {
    setForm({
      id: point.id,
      name: point.name || '',
      coordinates: point.coordinates || '',
      type: point.type || 'drilling',
      layer: point.layer || 'Скважина',
      holeNumber: point.hole_number || '',
      date: point.date || '',
      site: point.site || '',
      diameter: point.diameter ? String(point.diameter) : '',
      startTime: point.start_time || '',
      endTime: point.end_time || '',
      queue: point.queue ? String(point.queue) : '1',
      isDrilled: !!point.is_drilled,
      projectCoordinates: point.project_coordinates || '',
      trueCoordinates: point.true_coordinates || '',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleDelete = async (point) => {
    if (!confirm(`Удалить точку "${point.name}"?`)) return;
    try {
      const res = await fetch('/api/map/points', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: point.id, type: point.type }),
        credentials: 'include',
      });
      if (res.ok) {
        fetchPoints();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка удаления');
      }
    } catch {
      alert('Ошибка соединения');
    }
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const mainCoords = isDrilling
      ? form.trueCoordinates || form.projectCoordinates || form.coordinates
      : form.coordinates;

    if (!form.name || !mainCoords) {
      setError('Название и координаты обязательны');
      return;
    }

    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch('/api/map/points', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, coordinates: mainCoords }),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(isEditing ? 'Точка обновлена' : 'Точка добавлена');
        setTimeout(() => {
          setModalOpen(false);
          fetchPoints();
        }, 600);
      } else {
        setError(data.error || 'Ошибка сохранения');
      }
    } catch {
      setError('Ошибка соединения');
    }
  };

  if (loading) {
    return <div style={{ color: '#d4af37', textAlign: 'center', padding: '3rem' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <h1 style={{ color: '#d4af37', margin: 0, fontSize: '1.6rem' }}>🗺️ Карта участков</h1>
        {canEdit && (
          <button onClick={openAddModal} className="add-point-btn">
            ➕ Добавить точку
          </button>
        )}
      </div>

      <div style={{
        height: '75vh', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid #d4af37', boxShadow: '0 8px 32px rgba(212,175,55,0.15)',
      }}>
        <LeafletMap
          points={points}
          canEdit={canEdit}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#d4af37', margin: 0, fontSize: '1.3rem' }}>
                {isEditing ? '✏️ Редактировать точку' : '➕ Новая точка'}
              </h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label className="field-label">Название *</label>
              <input
                className="input-gold"
                placeholder="Например: Скважина №5"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <div className="field-row">
                <div style={{ flex: 1 }}>
                  <label className="field-label">Тип</label>
                  <select
                    className="input-gold"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    disabled={isEditing}
                  >
                    <option value="drilling">Буровая</option>
                    <option value="field">Полевая</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Номер скважины</label>
                  <input
                    className="input-gold"
                    placeholder="№"
                    value={form.holeNumber}
                    onChange={(e) => setForm({ ...form, holeNumber: e.target.value })}
                  />
                </div>
              </div>

              {isDrilling ? (
                <>
                  <div className="field-row">
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Участок работ</label>
                      <input
                        className="input-gold"
                        placeholder="Участок"
                        value={form.site}
                        onChange={(e) => setForm({ ...form, site: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Диаметр (мм)</label>
                      <input
                        className="input-gold"
                        type="number"
                        placeholder="мм"
                        value={form.diameter}
                        onChange={(e) => setForm({ ...form, diameter: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-row">
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Начало бурения</label>
                      <input
                        className="input-gold"
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Конец бурения</label>
                      <input
                        className="input-gold"
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <label className="field-label">Очередь бурения</label>
                  <select
                    className="input-gold"
                    value={form.queue}
                    onChange={(e) => setForm({ ...form, queue: e.target.value })}
                  >
                    <option value="1">🟢 1-я очередь</option>
                    <option value="2">🔵 2-я очередь</option>
                    <option value="3">🟡 3-я очередь</option>
                  </select>

                  <label className="field-label">Проектные координаты</label>
                  <input
                    className="input-gold"
                    placeholder="широта, долгота"
                    value={form.projectCoordinates}
                    onChange={(e) => setForm({ ...form, projectCoordinates: e.target.value })}
                  />

                  <label className="field-label">Истинные координаты (GPS)</label>
                  <input
                    className="input-gold"
                    placeholder="широта, долгота (после бурения)"
                    value={form.trueCoordinates}
                    onChange={(e) => setForm({ ...form, trueCoordinates: e.target.value })}
                  />

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.isDrilled}
                      onChange={(e) => setForm({ ...form, isDrilled: e.target.checked })}
                    />
                    <span>🔴 Пробурена</span>
                  </label>
                </>
              ) : (
                <>
                  <label className="field-label">Координаты *</label>
                  <input
                    className="input-gold"
                    placeholder="широта, долгота"
                    value={form.coordinates}
                    onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
                  />
                </>
              )}

              <label className="field-label">Дата</label>
              <input
                className="input-gold"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              {error && <p className="msg-error">{error}</p>}
              {success && <p className="msg-success">✓ {success}</p>}

              <button type="submit" className="submit-btn">
                {isEditing ? '💾 Сохранить' : '➕ Добавить'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .add-point-btn {
          background: linear-gradient(135deg, #d4af37, #f0d060);
          color: #0d0d0d;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 10px;
          font-weight: bold;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(212,175,55,0.3);
        }
        .add-point-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212,175,55,0.5);
        }
        .add-point-btn:active { transform: translateY(0); }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }
        .modal-box {
          background: linear-gradient(160deg, #1a1a1a, #0d0d0d);
          border: 1px solid #d4af37;
          border-radius: 18px;
          padding: 1.8rem;
          width: 100%;
          max-width: 460px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.4rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333;
        }
        .modal-close {
          background: none;
          border: none;
          color: #a67c6b;
          font-size: 1.4rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        .modal-close:hover {
          background: rgba(166,124,107,0.2);
          color: #fff;
          transform: rotate(90deg);
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .field-label {
          color: #d4af37;
          font-size: 0.82rem;
          margin-top: 0.6rem;
          margin-bottom: 0.2rem;
          font-weight: 500;
        }
        .field-row {
          display: flex;
          gap: 0.8rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #eee;
          margin-top: 0.9rem;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .checkbox-label input {
          width: 20px;
          height: 20px;
          accent-color: #d4af37;
          cursor: pointer;
        .checkbox-label input {
          width: 20px;
          height: 20px;
          accent-color: #d4af37;
          cursor: pointer;
        }
        .msg-error {
          color: #cf6b5e;
          font-size: 0.88rem;
          margin: 0.6rem 0 0;
          animation: shake 0.3s;
        }
        .msg-success {
          color: #2ecc71;
          font-size: 0.9rem;
          margin: 0.6rem 0 0;
        }
        .submit-btn {
          background: linear-gradient(135deg, #d4af37, #f0d060);
          color: #0d0d0d;
          border: none;
          padding: 0.85rem;
          border-radius: 10px;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1.2rem;
          transition: all 0.25s ease;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212,175,55,0.4);
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}