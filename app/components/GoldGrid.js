'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const GOLD_CSS = `
html body .wg-grid .ag-header {
  background: linear-gradient(180deg, #faf6ea, #f0e9d4) !important;
  border-bottom: 2px solid #d4af37 !important;
}
html body .wg-grid .ag-header-cell {
  color: #8a6d1f !important;
  font-weight: 600 !important;
  font-size: 0.8rem !important;
}
html body .wg-grid .ag-header-cell:not(.ag-column-group)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background: rgba(138,109,31,0.22);
  pointer-events: none;
}
html body .wg-grid .ag-cell:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 15%;
  height: 70%;
  width: 1px;
  background: rgba(138,125,106,0.18);
  pointer-events: none;
}
html body .wg-grid .ag-header-cell,
html body .wg-grid .ag-cell {
  position: relative !important;
}
html body .wg-grid .ag-row-hover {
  background-color: rgba(212,175,55,0.06) !important;
}
html body .wg-grid .ag-row-selected {
  background-color: rgba(212,175,55,0.12) !important;
}
html body .wg-grid .ag-cell-focus:focus {
  border-color: #d4af37 !important;
}
html body .wg-grid .ag-checkbox-input-wrapper.ag-checked::after {
  background-color: #d4af37 !important;
  border-color: #d4af37 !important;
}
html body .wg-grid .ag-paging-panel {
  border-top: 1px solid rgba(212,175,55,0.15) !important;
  background: rgba(250,246,234,0.5) !important;
  font-size: 0.8rem !important;
  color: #8a7e6a !important;
}
html body .wg-grid .ag-paging-button {
  color: #8a6d1f !important;
  border-color: rgba(212,175,55,0.3) !important;
}
html body .wg-grid .ag-paging-button:hover {
  background: rgba(212,175,55,0.1) !important;
  border-color: #d4af37 !important;
}
html body .wg-grid .ag-overlay-no-rows-wrapper {
  color: #a89a7e !important;
  font-size: 0.9rem !important;
}
html body .wg-grid .ag-root-wrapper {
  border-radius: 12px !important;
  overflow: hidden !important;
  border: 1px solid rgba(212,175,55,0.2) !important;
}
html body .wg-grid .coord-group-header {
  background: linear-gradient(180deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03)) !important;
  border-bottom: 1px solid rgba(212,175,55,0.25) !important;
}
html body .wg-grid .coord-group-header .ag-header-cell-label {
  justify-content: center !important;
}
html body .wg-grid .ag-column-group-icon {
  display: none !important;
}
`;

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('wg-gold-css')) return;
  const el = document.createElement('style');
  el.id = 'wg-gold-css';
  el.textContent = GOLD_CSS;
  document.head.appendChild(el);
}

export default function GoldGrid({
  columnDefs,
  rowData = [],
  onCellValueChanged,
  onDeleteRows,
  onAddRow,
  addRowLabel,
  getRowId,
  onSave,
  saveLabel,
  rowSelection = 'multiple',
  height = '65vh',
  customDefaultColDef,
}) {
  const gridRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { ensureStylesheet(); }, []);

  const defaultColDef = customDefaultColDef || {
    editable: true,
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
  };

  const handleDelete = useCallback(() => {
    if (!onDeleteRows || !gridRef.current?.api) return;
    const selected = gridRef.current.api.getSelectedRows();
    if (selected.length === 0) return;
    if (!confirm('Удалить ' + selected.length + ' записей?')) return;
    onDeleteRows(selected);
  }, [onDeleteRows]);

  const checkboxCol = onDeleteRows ? [{
    checkboxSelection: true,
    headerCheckboxSelection: true,
    width: 45,
    minWidth: 45,
    maxWidth: 45,
    pinned: 'left',
    suppressMenu: true,
    resizable: false,
    sortable: false,
    filter: false,
    editable: false,
  }] : [];

  const finalColumnDefs = [...checkboxCol, ...columnDefs];

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {onAddRow && (
            <button className="btn-gold" onClick={onAddRow} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {addRowLabel || '+ Добавить строку'}
            </button>
          )}
          {onDeleteRows && (
            <button className="btn-outline-gold" onClick={handleDelete} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'rgba(207,107,94,0.4)', color: '#cf6b5e' }}>
              Удалить выбранные
            </button>
          )}
          {onSave && (
            <button className="btn-gold" onClick={onSave} style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
              {saveLabel || 'Сохранить'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {ready && (
            <span style={{ color: '#8a7e6a', fontSize: '0.8rem' }}>
              {gridRef.current?.api?.getDisplayedRowCount() || 0} строк
            </span>
          )}
        </div>
      </div>
      <div
        className="ag-theme-alpine wg-grid"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={finalColumnDefs}
          defaultColDef={defaultColDef}
          onGridReady={() => setReady(true)}
          onCellValueChanged={onCellValueChanged}
          rowSelection={rowSelection}
          getRowId={getRowId}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          suppressRowClickSelection={true}
          pagination={true}
          paginationPageSize={1000}
          paginationPageSizeSelector={[50, 100, 200, 500, 1000, 5000]}
          localeText={{ noRowsToShow: 'Нет данных для отображения' }}
        />
      </div>
    </div>
  );
}
