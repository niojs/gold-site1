'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const OVERRIDE_CSS = `
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
`;

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('gold-grid-overrides')) return;
  const el = document.createElement('style');
  el.id = 'gold-grid-overrides';
  el.textContent = OVERRIDE_CSS;
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
}) {
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureStylesheet();
  }, []);

  const onGridReady = useCallback((params) => {
    setReady(true);
    const api = params.api;
    const cols = api.getColumnDefs();
    api.setGridOption('domLayout', 'normal');
    api.refreshCells({ force: true, suppressFlash: true });
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
        ref={containerRef}
        className="ag-theme-alpine gd-grid"
        style={{
          flex: 1,
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
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
