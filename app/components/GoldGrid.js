'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const GOLD_CSS = `
/* === CONTAINERS: kill ALL white backgrounds === */
html body .gd-grid,
html body .gd-grid *,
html body .gd-grid .ag-root-wrapper,
html body .gd-grid .ag-root,
html body .gd-grid .ag-body,
html body .gd-grid .ag-body-viewport,
html body .gd-grid .ag-body-viewport-wrapper,
html body .gd-grid .ag-body-horizontal-scroll-viewport,
html body .gd-grid .ag-center-cols-container,
html body .gd-grid .ag-center-cols-clipper,
html body .gd-grid .ag-center-cols-sprite,
html body .gd-grid .ag-pinned-left-cols-container,
html body .gd-grid .ag-pinned-right-cols-container,
html body .gd-grid .ag-pinned-left-header,
html body .gd-grid .ag-pinned-right-header,
html body .gd-grid .ag-full-width-container,
html body .gd-grid .ag-overlay-no-rows-wrapper,
html body .gd-grid .ag-body-horizontal-scroll {
  background-color: #111 !important;
  color: #e0dcc8 !important;
}

/* === HEADER === */
html body .gd-grid .ag-header {
  background: linear-gradient(180deg, #211b12, #1a1712) !important;
  border-bottom: 1px solid rgba(212,175,55,0.25) !important;
}
html body .gd-grid .ag-header-row,
html body .gd-grid .ag-header-row-column,
html body .gd-grid .ag-header-row-column-group {
  background: transparent !important;
}
html body .gd-grid .ag-header-cell,
html body .gd-grid .ag-header-cell-label,
html body .gd-grid .ag-header-cell-text {
  color: #d4af37 !important;
}
html body .gd-grid .ag-header-cell-label .ag-header-cell-text {
  font-weight: 600 !important;
}
html body .gd-grid .ag-header-icon {
  color: #d4af37 !important;
}
html body .gd-grid .ag-header-cell-menu-icon {
  color: #d4af37 !important;
}
html body .gd-grid .ag-floating-filter-button-icon {
  color: #d4af37 !important;
}

/* === ROWS === */
html body .gd-grid .ag-row {
  background-color: #111 !important;
  color: #e0dcc8 !important;
}
html body .gd-grid .ag-row-even {
  background-color: #111 !important;
}
html body .gd-grid .ag-row-odd {
  background-color: #151310 !important;
}
html body .gd-grid .ag-row:hover {
  background-color: rgba(212,175,55,0.08) !important;
}
html body .gd-grid .ag-row-selected {
  background-color: rgba(212,175,55,0.16) !important;
}

/* === CELLS === */
html body .gd-grid .ag-cell,
html body .gd-grid .ag-cell-wrapper,
html body .gd-grid .ag-row-even .ag-cell,
html body .gd-grid .ag-row-odd .ag-cell,
html body .gd-grid .ag-row .ag-cell {
  color: #e0dcc8 !important;
  background-color: #111 !important;
}
html body .gd-grid .ag-row-odd .ag-cell,
html body .gd-grid .ag-row-odd .ag-cell-wrapper {
  background-color: #151310 !important;
}
html body .gd-grid .ag-row:hover .ag-cell {
  background-color: rgba(212,175,55,0.08) !important;
  color: #e0dcc8 !important;
}
html body .gd-grid .ag-row-selected .ag-cell {
  background-color: rgba(212,175,55,0.16) !important;
  color: #e0dcc8 !important;
}
html body .gd-grid .ag-cell-focus,
html body .gd-grid .ag-cell-focus:focus,
html body .gd-grid .ag-cell-range-selected {
  border-color: #d4af37 !important;
  outline: none !important;
}
html body .gd-grid .ag-cell-inline-editing input,
html body .gd-grid .ag-cell-inline-editing select {
  background: #0d0b08 !important;
  color: #e0dcc8 !important;
  border: 1px solid #d4af37 !important;
}

/* === PAGINATION === */
html body .gd-grid .ag-paging-panel {
  background: #1a1712 !important;
  border-top: 1px solid rgba(212,175,55,0.15) !important;
}
html body .gd-grid .ag-paging-row-summary-panel,
html body .gd-grid .ag-paging-page-summary-panel,
html body .gd-grid .ag-paging-page-size-panel {
  background: #1a1712 !important;
  color: #8a7e6a !important;
}
html body .gd-grid .ag-paging-panel select,
html body .gd-grid .ag-paging-panel input {
  background: #111 !important;
  color: #e0dcc8 !important;
  border: 1px solid rgba(212,175,55,0.25) !important;
  border-radius: 6px !important;
  padding: 2px 6px !important;
}
html body .gd-grid .ag-paging-button {
  color: #d4af37 !important;
  background: transparent !important;
  border: 1px solid rgba(212,175,55,0.2) !important;
  border-radius: 4px !important;
  cursor: pointer !important;
}
html body .gd-grid .ag-paging-button:hover {
  background: rgba(212,175,55,0.1) !important;
}
html body .gd-grid .ag-paging-button[disabled],
html body .gd-grid .ag-paging-button-disabled {
  opacity: 0.3 !important;
  cursor: default !important;
}
html body .gd-grid .ag-paging-description {
  color: #8a7e6a !important;
}

/* === CHECKBOXES === */
html body .gd-grid .ag-checkbox-input-wrapper::after {
  border-color: #d4af37 !important;
}
html body .gd-grid .ag-checkbox-input-wrapper.ag-checked::after {
  background-color: #d4af37 !important;
  border-color: #d4af37 !important;
}

/* === FLOATING FILTER === */
html body .gd-grid .ag-floating-filter-input input {
  background: #1a1712 !important;
  border: 1px solid rgba(212,175,55,0.2) !important;
  border-radius: 4px !important;
  color: #e0dcc8 !important;
  padding: 4px 6px !important;
  font-size: 0.8rem !important;
}
html body .gd-grid .ag-floating-filter-input input:focus {
  border-color: #d4af37 !important;
  outline: none !important;
}

/* === SCROLLBAR === */
html body .gd-grid .ag-body-viewport::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
}
html body .gd-grid .ag-body-viewport::-webkit-scrollbar-track {
  background: #111 !important;
}
html body .gd-grid .ag-body-viewport::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.3) !important;
  border-radius: 3px !important;
}
html body .gd-grid * {
  scrollbar-color: rgba(212,175,55,0.3) #111;
}

/* === MENUS / POPUPS === */
html body .gd-grid .ag-menu,
html body .gd-grid .ag-popup {
  background: #1a1712 !important;
}
html body .gd-grid .ag-select-list,
html body .gd-grid .ag-popup-child {
  background: #1a1712 !important;
  border-color: rgba(212,175,55,0.25) !important;
}
html body .gd-grid .ag-select-option,
html body .gd-grid .ag-popup-child .ag-list-item {
  color: #e0dcc8 !important;
}
html body .gd-grid .ag-select-option:hover,
html body .gd-grid .ag-popup-child .ag-list-item:hover {
  background: rgba(212,175,55,0.1) !important;
}
html body .gd-grid .ag-select-option-selected,
html body .gd-grid .ag-popup-child .ag-list-item-selected {
  background: rgba(212,175,55,0.15) !important;
  color: #d4af37 !important;
}
html body .gd-grid .ag-filter-toolpanel-body {
  background: #111 !important;
  color: #e0dcc8 !important;
}
html body .gd-grid .ag-tool-panel {
  background: #1a1712 !important;
  color: #e0dcc8 !important;
}
html body .gd-grid .ag-column-select-column {
  background: #1a1712 !important;
}

/* === BORDER === */
html body .gd-grid .ag-root-wrapper {
  border: 1px solid rgba(212,175,55,0.2) !important;
  border-radius: 12px !important;
  overflow: hidden !important;
}

/* === ROW/COL BORDERS === */
html body .gd-grid .ag-row {
  border-bottom: 1px solid rgba(212,175,55,0.07) !important;
}
html body .gd-grid .ag-cell {
  border-right: 1px solid rgba(212,175,55,0.06) !important;
  border-left: none !important;
  border-top: none !important;
}
html body .gd-grid .ag-header {
  border-bottom: 1px solid rgba(212,175,55,0.25) !important;
}
`;

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('gold-grid-overrides')) return;
  const el = document.createElement('style');
  el.id = 'gold-grid-overrides';
  el.textContent = GOLD_CSS;
  document.head.appendChild(el);
}

const AG_VAR_STYLE = {
  '--ag-background-color': '#111',
  '--ag-foreground-color': '#e0dcc8',
  '--ag-header-background-color': '#1a1712',
  '--ag-header-foreground-color': '#d4af37',
  '--ag-odd-row-background-color': '#151310',
  '--ag-row-hover-color': 'rgba(212,175,55,0.08)',
  '--ag-selected-row-background-color': 'rgba(212,175,55,0.16)',
  '--ag-range-selection-background-color': 'rgba(212,175,55,0.1)',
  '--ag-font-family': "'Segoe UI', system-ui, sans-serif",
  '--ag-border-color': 'rgba(212,175,55,0.15)',
  '--ag-secondary-border-color': 'rgba(212,175,55,0.15)',
  '--ag-input-focus-color': '#d4af37',
  '--ag-input-focus-border-color': '#d4af37',
  '--ag-alpine-active-color': '#d4af37',
  '--ag-checkbox-checked-color': '#d4af37',
  '--ag-checkbox-unchecked-color': '#d4af37',
  '--ag-row-height': '42px',
  '--ag-font-size': '13px',
  '--ag-internal-use-row-height': 'true',
};

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureStylesheet();
  }, []);

  const onGridReady = useCallback((params) => {
    setReady(true);
    requestAnimationFrame(() => {
      params.api.refreshCells({ force: true, suppressFlash: true });
    });
  }, []);

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
        className="ag-theme-alpine gd-grid"
        style={{
          flex: 1,
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          ...AG_VAR_STYLE,
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
