'use client';
import { useState, useCallback } from 'react';

export default function useCrud({
  apiEndpoint,
  mapToRow,
  mapToApi,
  siteFilter,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showSuccess = useCallback((msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return;
        showError('Ошибка загрузки данных');
        return;
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.records || []);
      const filtered = siteFilter ? rows.filter(r => (r.site || r.work_area || '') === siteFilter) : rows;
      setRecords(filtered.map(mapToRow));
    } catch {
      showError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, siteFilter, mapToRow, showError]);

  const addRow = useCallback(() => {
    const newRow = {
      id: 'new_' + Date.now(),
      ...mapToRow({}),
    };
    setRecords(prev => [newRow, ...prev]);
  }, [mapToRow]);

  const deleteRows = useCallback(async (rows) => {
    const ids = rows.map(r => r.id).filter(id => !String(id).startsWith('new_'));
    if (ids.length === 0) {
      setRecords(prev => prev.filter(r => String(r.id).startsWith('new_') || !rows.find(d => d.id === r.id)));
      return;
    }
    try {
      for (const id of ids) {
        const res = await fetch(apiEndpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: ids.length === 1 ? id : ids }),
        });
        if (!res.ok) {
          const data = await res.json();
          showError(data.error || 'Ошибка удаления');
          return;
        }
      }
      showSuccess('Записи удалены');
      fetchRecords();
    } catch {
      showError('Ошибка соединения');
    }
  }, [apiEndpoint, fetchRecords, showSuccess, showError]);

  const saveRow = useCallback(async (row) => {
    const isNew = String(row.id).startsWith('new_');
    const apiData = mapToApi(row);
    try {
      const res = await fetch(apiEndpoint, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isNew ? apiData : { id: row.id, ...apiData }),
      });
      if (!res.ok) {
        const data = await res.json();
        showError(data.error || 'Ошибка сохранения');
        return false;
      }
      return true;
    } catch {
      showError('Ошибка соединения');
      return false;
    }
  }, [apiEndpoint, mapToApi, showError]);

  const onCellValueChanged = useCallback(async (event) => {
    const { data } = event;
    const success = await saveRow(data);
    if (success) {
      const isNew = String(data.id).startsWith('new_');
      showSuccess(isNew ? 'Запись добавлена' : 'Запись обновлена');
      fetchRecords();
    }
  }, [saveRow, fetchRecords, showSuccess]);

  const saveAll = useCallback(async () => {
    let saved = 0;
    for (const row of records) {
      const ok = await saveRow(row);
      if (ok) saved++;
    }
    if (saved > 0) {
      showSuccess('Сохранено: ' + saved);
      fetchRecords();
    }
  }, [records, saveRow, fetchRecords, showSuccess]);

  return {
    records,
    setRecords,
    loading,
    error,
    success,
    fetchRecords,
    addRow,
    deleteRows,
    saveRow,
    onCellValueChanged,
    saveAll,
    clearError: () => setError(''),
    clearSuccess: () => setSuccess(''),
  };
}
