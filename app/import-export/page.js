'use client';

import { useState } from 'react';

export default function ImportExportPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

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
    <div style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ color: '#d4af37', marginBottom: '2rem', fontSize: '1.6rem', fontWeight: 700 }}>
        📤 Импорт / Экспорт данных
      </h1>

      {/* ЭКСПОРТ */}
      <div className="ie-card">
        <div className="ie-card-header">
          <span className="ie-card-icon">📥</span>
          <div>
            <h2 className="ie-card-title">Экспорт данных</h2>
            <p className="ie-card-desc">Выберите таблицу и формат для скачивания</p>
          </div>
        </div>

        <label className="ie-label">Таблица</label>
        <select
          className="ie-select"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          <option value="all">📁 Все таблицы</option>
          <option value="drilling">⛏️ Буровые работы</option>
          <option value="field">📝 Полевые данные</option>
          <option value="washing">🧪 Промывка</option>
          <option value="assay">⚗️ Пробы</option>
          <option value="primary">📐 Первичные данные</option>
        </select>

        <div className="ie-btn-row">
          <button className="ie-btn primary" onClick={() => handleExport('xlsx')}>
            <span>📊</span> Скачать Excel
          </button>
          <button className="ie-btn outline" onClick={() => handleExport('csv')}>
            <span>📄</span> Скачать CSV
          </button>
        </div>
      </div>

      {/* ИМПОРТ */}
      <div className="ie-card">
        <div className="ie-card-header">
          <span className="ie-card-icon">📤</span>
          <div>
            <h2 className="ie-card-title">Импорт данных</h2>
            <p className="ie-card-desc">Загрузите файл Excel (.xlsx) или CSV</p>
          </div>
        </div>

        <form onSubmit={handleImport}>
          <label
            className={`ie-dropzone ${dragOver ? 'drag-over' : ''} ${fileName ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
          >
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              required
              onChange={(e) => setFileName(e.target.files[0]?.name || '')}
              style={{ display: 'none' }}
            />
            {fileName ? (
              <>
                <span className="dropzone-icon">✅</span>
                <span className="dropzone-text">{fileName}</span>
                <span className="dropzone-hint">Нажмите для замены файла</span>
              </>
            ) : (
              <>
                <span className="dropzone-icon">📁</span>
                <span className="dropzone-text">Перетащите файл сюда</span>
                <span className="dropzone-hint">или нажмите для выбора</span>
              </>
            )}
          </label>

          <button className="ie-btn primary full" type="submit" disabled={loading || !fileName}>
            {loading ? '⏳ Загрузка...' : '⬆️ Загрузить'}
          </button>
        </form>

        {message && (
          <div className={`ie-msg ${messageType}`}>
            {messageType === 'success' ? '✅' : '❌'} {message}
          </div>
        )}
      </div>

      <style jsx>{`
        .ie-card {
          background: linear-gradient(160deg, #1a1712, #111);
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 16px;
          padding: 1.8rem;
          margin-bottom: 1.5rem;
          transition: border-color 0.2s;
        }
        .ie-card:hover {
          border-color: rgba(212,175,55,0.35);
        }
        .ie-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .ie-card-icon {
          font-size: 2rem;
          background: rgba(212,175,55,0.1);
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          flex-shrink: 0;
        }
        .ie-card-title {
          color: #d4af37;
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0 0 0.2rem;
        }
        .ie-card-desc {
          color: #7a7060;
          font-size: 0.85rem;
          margin: 0;
        }

        .ie-label {
          display: block;
          color: #a89a7e;
          font-size: 0.78rem;
          letter-spacing: 0.5px;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          font-weight: 600;
        }
        .ie-select {
          width: 100%;
          background: #111;
          color: #e0dcc8;
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: border-color 0.2s;
          margin-bottom: 1.2rem;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d4af37' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
        }
        .ie-select:focus {
          outline: none;
          border-color: #d4af37;
        }
        .ie-select option {
          background: #1a1712;
          color: #e0dcc8;
        }

        .ie-btn-row {
          display: flex;
          gap: 0.8rem;
        }
        .ie-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.4rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
          border: none;
        }
        .ie-btn.primary {
          background: linear-gradient(135deg, #d4af37, #c9a227);
          color: #111;
        }
        .ie-btn.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(212,175,55,0.35);
        }
        .ie-btn.outline {
          background: transparent;
          color: #d4af37;
          border: 1px solid rgba(212,175,55,0.35);
        }
        .ie-btn.outline:hover {
          background: rgba(212,175,55,0.08);
          border-color: #d4af37;
        }
        .ie-btn.full {
          width: 100%;
          margin-top: 1rem;
        }
        .ie-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .ie-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2.5rem 1.5rem;
          border: 2px dashed rgba(212,175,55,0.25);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s;
          text-align: center;
        }
        .ie-dropzone:hover,
        .ie-dropzone.drag-over {
          border-color: #d4af37;
          background: rgba(212,175,55,0.04);
        }
        .ie-dropzone.has-file {
          border-color: rgba(46,204,113,0.4);
          background: rgba(46,204,113,0.04);
        }
        .dropzone-icon {
          font-size: 2.5rem;
          line-height: 1;
        }
        .dropzone-text {
          color: #c0b89a;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .dropzone-hint {
          color: #6a6050;
          font-size: 0.8rem;
        }

        .ie-msg {
          margin-top: 1rem;
          padding: 0.8rem 1rem;
          border-radius: 10px;
          font-size: 0.9rem;
          animation: fadeUp 0.3s ease;
        }
        .ie-msg.success {
          background: rgba(46,204,113,0.1);
          color: #2ecc71;
          border: 1px solid rgba(46,204,113,0.3);
        }
        .ie-msg.error {
          background: rgba(207,107,94,0.1);
          color: #cf6b5e;
          border: 1px solid rgba(207,107,94,0.3);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
