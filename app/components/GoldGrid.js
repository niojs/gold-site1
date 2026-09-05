'use client';

import { useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

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
        className="ag-theme-alpine gold-grid"
        data-gold="1"
        style={{
          flex: 1,
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          '--ag-background-color': '#111111',
          '--ag-foreground-color': '#e0dcc8',
          '--ag-header-background-color': '#1a1712',
          '--ag-header-foreground-color': '#d4af37',
          '--ag-odd-row-background-color': '#151310',
          '--ag-row-hover-color': 'rgba(212, 175, 55, 0.08)',
          '--ag-selected-row-background-color': 'rgba(212, 175, 55, 0.15)',
          '--ag-range-selection-background-color': 'rgba(212, 175, 55, 0.1)',
          '--ag-font-family': "'Segoe UI', system-ui, sans-serif",
          '--ag-border-color': 'rgba(212, 175, 55, 0.15)',
          '--ag-secondary-border-color': 'rgba(212, 175, 55, 0.15)',
          '--ag-input-focus-color': '#d4af37',
          '--ag-input-focus-border-color': '#d4af37',
          '--ag-alpine-active-color': '#d4af37',
          '--ag-checkbox-checked-color': '#d4af37',
          '--ag-checkbox-unchecked-color': '#d4af37',
          '--ag-odd-row-background-color': '#151310',
          '--ag-row-hover-color': 'rgba(212, 175, 55, 0.08)',
          '--ag-selected-row-background-color': 'rgba(212, 175, 55, 0.15)',
          colorScheme: 'dark',
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
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
        />
      </div>
      <style jsx global>{`
        [data-gold="1"] {
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        [data-gold="1"] .ag-root-wrapper,
        [data-gold="1"] .ag-root,
        [data-gold="1"] .ag-body-viewport,
        [data-gold="1"] .ag-body-horizontal-scroll-viewport,
        [data-gold="1"] .ag-pinned-left-cols-container,
        [data-gold="1"] .ag-pinned-right-cols-container,
        [data-gold="1"] .ag-full-width-container,
        [data-gold="1"] .ag-center-cols-container {
          background-color: #111 !important;
          color: #e0dcc8 !important;
        }

        [data-gold="1"] .ag-header,
        [data-gold="1"] .ag-header-row,
        [data-gold="1"] .ag-header-row-column,
        [data-gold="1"] .ag-pinned-left-header,
        [data-gold="1"] .ag-pinned-right-header,
        [data-gold="1"] .ag-header-cell {
          background: linear-gradient(180deg, #211b12 0%, #1a1712 100%) !important;
          border-bottom: 1px solid rgba(212, 175, 55, 0.25) !important;
          color: #d4af37 !important;
        }
        [data-gold="1"] .ag-header-cell-label .ag-header-cell-text {
          color: #d4af37 !important;
          font-weight: 600;
        }
        [data-gold="1"] .ag-header-icon {
          color: #d4af37 !important;
        }

        [data-gold="1"] .ag-row,
        [data-gold="1"] .ag-row-even,
        [data-gold="1"] .ag-row-odd {
          background-color: #111 !important;
          color: #e0dcc8 !important;
        }
        [data-gold="1"] .ag-row-odd {
          background-color: #151310 !important;
        }
        [data-gold="1"] .ag-row-odd .ag-cell {
          background-color: #151310 !important;
          color: #e0dcc8 !important;
        }
        [data-gold="1"] .ag-row-even .ag-cell {
          background-color: #111 !important;
          color: #e0dcc8 !important;
        }

        [data-gold="1"] .ag-cell {
          background-color: #111 !important;
          color: #e0dcc8 !important;
          border-bottom: 1px solid rgba(212, 175, 55, 0.07) !important;
          border-right: 1px solid rgba(212, 175, 55, 0.06) !important;
        }

        [data-gold="1"] .ag-row-hover .ag-cell,
        [data-gold="1"] .ag-row-hover {
          background-color: rgba(212, 175, 55, 0.08) !important;
          color: #e0dcc8 !important;
        }
        [data-gold="1"] .ag-row-selected .ag-cell,
        [data-gold="1"] .ag-row-selected {
          background-color: rgba(212, 175, 55, 0.16) !important;
          color: #e0dcc8 !important;
        }

        [data-gold="1"] .ag-cell-focus,
        [data-gold="1"] .ag-cell-range-selected {
          border-color: #d4af37 !important;
        }
        [data-gold="1"] .ag-cell-focus:focus,
        [data-gold="1"] .ag-cell-inline-editing .ag-cell {
          border-color: #d4af37 !important;
          outline: none !important;
        }

        [data-gold="1"] .ag-paging-panel,
        [data-gold="1"] .ag-paging-row-summary-panel,
        [data-gold="1"] .ag-paging-page-size-panel {
          background: #1a1712 !important;
          color: #8a7e6a !important;
          border-top: 1px solid rgba(212, 175, 55, 0.15) !important;
        }
        [data-gold="1"] .ag-paging-panel select,
        [data-gold="1"] .ag-paging-panel input {
          background: #111 !important;
          color: #e0dcc8 !important;
          border: 1px solid rgba(212, 175, 55, 0.25) !important;
          border-radius: 6px;
        }
        [data-gold="1"] .ag-paging-button {
          color: #d4af37 !important;
          border: 1px solid rgba(212, 175, 55, 0.2) !important;
        }
        [data-gold="1"] .ag-paging-button:hover {
          background: rgba(212, 175, 55, 0.1) !important;
        }
        [data-gold="1"] .ag-paging-button[disabled] {
          opacity: 0.3;
        }

        [data-gold="1"] .ag-overlay-no-rows-wrapper {
          background: #111 !important;
          color: #8a7e6a !important;
        }

        [data-gold="1"] .ag-checkbox-input-wrapper::after {
          border-color: #d4af37;
        }
        [data-gold="1"] .ag-checkbox-input-wrapper.ag-checked::after {
          background-color: #d4af37;
          border-color: #d4af37;
        }

        [data-gold="1"] .ag-floating-filter-input input {
          background: #1a1712;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 4px;
          color: #e0dcc8;
          padding: 4px 6px;
          font-size: 0.8rem;
        }
        [data-gold="1"] .ag-floating-filter-input input:focus {
          border-color: #d4af37;
        }

        [data-gold="1"] .ag-body-viewport::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        [data-gold="1"] .ag-body-viewport::-webkit-scrollbar-track {
          background: #111;
        }
        [data-gold="1"] .ag-body-viewport::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }

        [data-gold="1"] .ag-select-list,
        [data-gold="1"] .ag-popup-child {
          background: #1a1712 !important;
          border-color: rgba(212, 175, 55, 0.25);
        }
        [data-gold="1"] .ag-select-option,
        [data-gold="1"] .ag-popup-child .ag-list-item {
          color: #e0dcc8 !important;
        }
        [data-gold="1"] .ag-select-option:hover,
        [data-gold="1"] .ag-popup-child .ag-list-item:hover {
          background: rgba(212, 175, 55, 0.1);
        }
        [data-gold="1"] .ag-select-option-selected,
        [data-gold="1"] .ag-popup-child .ag-list-item-selected {
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
        }

        [data-gold="1"] .ag-cell-inline-editing input,
        [data-gold="1"] .ag-cell-inline-editing select {
          background: #0d0b08 !important;
          color: #e0dcc8 !important;
          border: 1px solid #d4af37 !important;
        }

        [data-gold="1"] .ag-column-select-column,
        [data-gold="1"] .ag-tool-panel {
          background: #1a1712 !important;
          color: #e0dcc8 !important;
        }

        [data-gold="1"] .ag-menu {
          background: #1a1712 !important;
        }
        [data-gold="1"] .ag-filter-toolpanel-body {
          background: #111 !important;
        }
      `}</style>
    </div>
  );
}
