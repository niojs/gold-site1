'use client';

import { useState } from 'react';

export default function ImportExportPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');

  const handleExport = () => {
    const url = `/api/export${selectedTable !== 'all' ? `?table=${selectedTable}` : ''}`;
    window.location.href = url;
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
      } else {
        setMessage(data.error || 'Ошибка импорта');
      }
    } catch (err) {
      setMessage('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ color: '#d4af37', marginBottom: '2rem' }}>📤 Импорт / Экспорт данных</h1>

      {/* Экспорт */}
      <div className="gold-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Экспорт</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input-gold"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{ maxWidth: '250px' }}
          >
            <option value="all">📁 Все таблицы</option>
            <option value="drilling">🔧 Буровые работы</option>
            <option value="field">📝 Полевые данные</option>
            <option value="washing">🧪 Отдел промывки</option>
            <option value="assay">⚗️ Отдел проб</option>
          </select>
          <button className="btn-gold" onClick={handleExport}>
            Скачать CSV
          </button>
        </div>
      </div>

      {/* Импорт */}
      <div className="gold-card">
        <h2 style={{ color: '#d4af37', marginBottom: '1rem' }}>Импорт</h2>
        <form onSubmit={handleImport}>
          <input type="file" name="file" accept=".csv" className="input-gold" style={{ marginBottom: '1rem' }} required />
          <button className="btn-gold" type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>
        {message && <p style={{ color: '#d4af37', marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
}