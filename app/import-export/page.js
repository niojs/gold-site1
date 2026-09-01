'use client';

import { useState } from 'react';

export default function ImportExportPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [fileName, setFileName] = useState('');

  const handleExport = (format) => {
    const params = new URLSearchParams();
    if (selectedTable !== 'all') params.set('table', selectedTable);
    params.set('format', format);
    window.location.href = `/api/export?${params.toString()}`;
  };

  const handleImport = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Импорт выполнен');
        setMessageType('success');
        e.target.reset();
        setFileName('');
      } else {
        setMessage(data.error || 'Ошибка импорта');
        setMessageType('error');
      }
    } catch {
      setMessage('Ошибка соединения');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#d4af37', marginBottom: '2rem', fontSize: '1.6rem' }}>
        📤 Импорт / Экспорт данных
      </h1>

      {/* ЭКСПОРТ */}
      <div className="gold-card">
        <h2 style={{ color: '#d4af37', marginBottom: '0.4rem', fontSize: '1.15rem' }}>Экспорт данных</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 1.2rem' }}>Выберите таблицу и формат для скачивания</p>

        <label style={{ display: 'block', color: '#a89a7e', fontSize: '0.78rem', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Таблица</label>
        <select
          className="input-gold"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="all">📁 Все таблицы</option>
          <option value="drilling">🔧 Буровые работы</option>
          <option value="field">📝 Полевые данные</option>
          <option value="washing">🧪 Отдел промывки</option>
          <option value="assay">⚗️ Отдел проб</option>
        </select>

        <div className="btn-row">
          <button className="btn-gold" onClick={() => handleExport('xlsx')} style={{ flex: 1, minWidth: 140 }}>
            Скачать Excel
          </button>
          <button className="btn-outline-gold" onClick={() => handleExport('csv')} style={{ flex: 1, minWidth: 140 }}>
            Скачать CSV
          </button>
        </div>
      </div>

      {/* ИМПОРТ */}
      <div className="gold-card">
        <h2 style={{ color: '#d4af37', marginBottom: '0.4rem', fontSize: '1.15rem' }}>Импорт данных</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 1.2rem' }}>Загрузите файл Excel (.xlsx) или CSV</p>

        <form onSubmit={handleImport}>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
            padding: '2rem', border: '2px dashed rgba(212,175,55,0.3)', borderRadius: 12,
            cursor: 'pointer', transition: 'all 0.25s', marginBottom: '0.5rem',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              required
              onChange={(e) => setFileName(e.target.files[0]?.name || '')}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '2rem' }}>📁</span>
            <span style={{ color: '#c0b89a', fontSize: '0.9rem', textAlign: 'center' }}>
              {fileName || 'Нажмите, чтобы выбрать файл'}
            </span>
          </label>

          <button className="btn-gold" type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>

        {message && (
          <p className={`msg ${messageType}`}>{message}</p>
        )}
      </div>

      <style jsx>{`
        .card {
          background: linear-gradient(160deg, #1a1a1a, #0d0d0d);
          border: 1px solid #d4af37;
          border-radius: 16px;
          padding: 1.8rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          animation: fadeUp 0.4s ease;
        }
        .card-title {
          color: #d4af37;
          margin: 0 0 0.4rem;
          font-size: 1.2rem;
        }
        .card-hint {
          color: #888;
          font-size: 0.85rem;
          margin: 0 0 1.2rem;
        }
        .lbl {
          display: block;
          color: #d4af37;
          font-size: 0.8rem;
          margin-bottom: 0.4rem;
        }
        .inp {
          width: 100%;
          background: #0d0d0d;
          color: #fff;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 0.7rem;
          font-size: 0.95rem;
          margin-bottom: 1.2rem;
          cursor: pointer;
          transition: border 0.2s;
        }
        .inp:focus { border-color: #d4af37; outline: none; }

        .btn-row {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: linear-gradient(135deg, #d4af37, #f0d060);
          color: #0d0d0d;
          border: none;
          padding: 0.8rem 1.4rem;
          border-radius: 10px;
          font-weight: bold;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          flex: 1;
          min-width: 140px;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212,175,55,0.4);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary.full { width: 100%; margin-top: 1rem; }

        .btn-secondary {
          background: transparent;
          color: #d4af37;
          border: 1px solid #d4af37;
          padding: 0.8rem 1.4rem;
          border-radius: 10px;
          font-weight: bold;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          flex: 1;
          min-width: 140px;
        }
        .btn-secondary:hover {
          background: rgba(212,175,55,0.1);
          transform: translateY(-2px);
        }

        .file-drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          padding: 2rem;
          border: 2px dashed #444;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .file-drop:hover {
          border-color: #d4af37;
          background: rgba(212,175,55,0.05);
        }
        .file-icon { font-size: 2.5rem; }
        .file-text { color: #ccc; font-size: 0.9rem; text-align: center; }

        .msg {
          margin-top: 1rem;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          animation: fadeUp 0.3s ease;
        }
        .msg.success {
          background: rgba(46,204,113,0.12);
          color: #2ecc71;
          border: 1px solid rgba(46,204,113,0.3);
        }
        .msg.error {
          background: rgba(207,107,94,0.12);
          color: #cf6b5e;
          border: 1px solid rgba(207,107,94,0.3);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}