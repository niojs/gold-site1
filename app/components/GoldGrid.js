'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const OVERRIDE_CSS = `
.gd-grid .ag-cell,
.gd-grid .ag-row-even .ag-cell,
.gd-grid .ag-row-odd .ag-cell,
.gd-grid .ag-row .ag-cell,
.gd-grid .ag-row-even,
.gd-grid .ag-row-odd,
.gd-grid .ag-row,
.gd-grid .ag-cell-wrapper {
  color: #e0dcc8 !important;
  background-color: #111 !important;
}
.gd-grid .ag-row-odd,
.gd-grid .ag-row-odd .ag-cell,
.gd-grid .ag-row-odd .ag-cell-wrapper {
  background-color: #151310 !important;
}
.gd-grid .ag-row-hover,
.gd-grid .ag-row-hover .ag-cell {
  background-color: rgba(212, 175, 55, 0.08) !important;
  color: #e0dcc8 !important;
}
.gd-grid .ag-row-selected,
.gd-grid .ag-row-selected .ag-cell {
  background-color: rgba(212, 175, 55, 0.16) !important;
  color: #e0dcc8 !important;
}
.gd-grid .ag-header,
.gd-grid .ag-header-row,
.gd-grid .ag-header-row-column,
.gd-grid .ag-pinned-left-header,
.gd-grid .ag-pinned-right-header {
  background: linear-gradient(180deg, #211b12 0%, #1a1712 100%) !important;
}
.gd-grid .ag-header-cell {
  background: transparent !important;
  color: #d4af37 !important;
}
.gd-grid .ag-header-cell-label .ag-header-cell-text {
  color: #d4af37 !important;
  font-weight: 600 !important;
}
.gd-grid .ag-header-icon {
  color: #d4af37 !important;
}
.gd-grid .ag-cell-focus,
.gd-grid .ag-cell-focus:focus,
.gd-grid .ag-cell-range-selected {
  border-color: #d4af37 !important;
  outline: none !important;
}
.gd-grid .ag-cell-inline-editing .ag-cell,
.gd-grid .ag-cell-inline-editing input,
.gd-grid .ag-cell-inline-editing select {
  background: #0d0b08 !important;
  color: #e0dcc8 !important;
  border: 1px solid #d4af37 !important;
}
.gd-grid .ag-paging-panel,
.gd-grid .ag-paging-row-summary-panel,
.gd-grid .ag-paging-page-size-panel {
  background: #1a1712 !important;
  color: #8a7e6a !important;
  border-top: 1px solid rgba(212, 175, 55, 0.15) !important;
}
.gd-grid .ag-paging-panel select,
.gd-grid .ag-paging-panel input {
  background: #111 !important;
  color: #e0dcc8 !important;
  border: 1px solid rgba(212, 175, 55, 0.25) !important;
  border-radius: 6px;
}
.gd-grid .ag-paging-button {
  color: #d4af37 !important;
  border: 1px solid rgba(212, 175, 55, 0.2) !important;
}
.gd-grid .ag-paging-button:hover {
  background: rgba(212, 175, 55, 0.1) !important;
}
.gd-grid .ag-paging-button[disabled] {
  opacity: 0.3;
}
.gd-grid .ag-overlay-no-rows-wrapper {
  background: #111 !important;
  color: #8a7e6a !important;
}
.gd-grid .ag-checkbox-input-wrapper::after {
  border-color: #d4af37;
}
.gd-grid .ag-checkbox-input-wrapper.ag-checked::after {
  background-color: #d4af37;
  border-color: #d4af37;
}
.gd-grid .ag-floating-filter-input input {
  background: #1a1712;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 4px;
  color: #e0dcc8;
  padding: 4px 6px;
  font-size: 0.8rem;
}
.gd-grid .ag-floating-filter-input input:focus {
  border-color: #d4af37;
}
.gd-grid .ag-body-viewport::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.gd-grid .ag-body-viewport::-webkit-scrollbar-track {
  background: #111;
}
.gd-grid .ag-body-viewport::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 3px;
}
.gd-grid .ag-select-list,
.gd-grid .ag-popup-child {
  background: #1a1712 !important;
  border-color: rgba(212, 175, 55, 0.25);
}
.gd-grid .ag-select-option,
.gd-grid .ag-popup-child .ag-list-item {
  color: #e0dcc8 !important;
}
.gd-grid .ag-select-option:hover,
.gd-grid .ag-popup-child .ag-list-item:hover {
  background: rgba(212, 175, 55, 0.1);
}
.gd-grid .ag-select-option-selected,
.gd-grid .ag-popup-child .ag-list-item-selected {
  background: rgba(212, 175, 55, 0.15);
  color: #d4af37;
}
.gd-grid .ag-menu {
  background: #1a1712 !important;
}
.gd-grid .ag-filter-toolpanel-body {
  background: #111 !important;
}
.gd-grid .ag-column-select-column,
.gd-grid .ag-tool-panel {
  background: #1a1712 !important;
  color: #e0dcc8 !important;
}
.gd-grid .ag-root-wrapper {
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  overflow: hidden;
}
`;

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('gold-grid-overrides')) return;
  const el = document.createElement('style');
  el.id = 'gold-grid-overrides';
  el.textContent = OVERRIDE_CSS;
  document.head.appendChild(el);
}

function forceColorStyles(gridEl) {
  if (!gridEl) return;
  const allCells = gridEl.querySelectorAll('.ag-cell, .ag-header-cell, .ag-cell-wrapper, .ag-row span');
  allCells.forEach(c => {
    c.style.color = '#e0dcc8';
  });
  const headerCells = gridEl.querySelectorAll('.ag-header-cell');
  headerCells.forEach(c => {
    c.style.color = '#d4af37';
  });
  const rows = gridEl.querySelectorAll('.ag-row');
  rows.forEach((row, i) => {
    const isOdd = row.classList.contains('ag-row-odd');
    row.style.backgroundColor = isOdd ? '#151310' : '#111';
    row.style.color = '#e0dcc8';
  });
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
}) {
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureStylesheet();
  }, []);

  const onGridReady = useCallback(() => {
    setReady(true);
    requestAnimationFrame(() => {
      if (containerRef.current) {
        forceColorStyles(containerRef.current);
      }
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new MutationObserver(() => {
      forceColorStyles(containerRef.current);
    });
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    requestAnimationFrame(() => forceColorStyles(containerRef.current));
  }, [rowData]);

  const defaultColDef = {
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
        ref={containerRef}
        className="ag-theme-alpine gd-grid"
        style={{
          flex: 1,
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={finalColumnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          rowSelection={rowSelection}
          getRowId={getRowId}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          suppressRowClickSelection={true}
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
        />
      </div>
    </div>
  );
}
