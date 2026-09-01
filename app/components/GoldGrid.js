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
    cellStyle: {
      color: '#e0dcc8',
      fontSize: '0.85rem',
      borderRight: '1px solid rgba(212,175,55,0.08)',
    },
    headerStyle: {
      color: '#d4af37',
      fontWeight: '600',
      fontSize: '0.82rem',
      letterSpacing: '0.3px',
    },
  };

  const handleDelete = useCallback(() => {
    if (!onDeleteRows || !gridRef.current?.api) return;
    const selected = gridRef.current.api.getSelectedRows();
    if (selected.length === 0) return;
    if (!confirm(`Удалить ${selected.length} записей?`)) return;
    onDeleteRows(selected);
  }, [onDeleteRows]);

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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {ready && (
            <span style={{ color: '#8a7e6a', fontSize: '0.8rem' }}>
              {gridRef.current?.api?.getDisplayedRowCount() || 0} строк
            </span>
          )}
          {onSave && (
            <button className="btn-gold" onClick={onSave} style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
              {saveLabel || 'Сохранить'}
            </button>
          )}
        </div>
      </div>
      <div
        className="ag-theme-alpine gold-grid"
        style={{ flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden', colorScheme: 'dark' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
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
        .gold-grid .ag-theme-alpine {
          --ag-background-color: #111;
          --ag-header-background-color: #1a1712;
          --ag-odd-row-background-color: #151310;
          --ag-row-hover-color: rgba(212, 175, 55, 0.06);
          --ag-selected-row-background-color: rgba(212, 175, 55, 0.1);
          --ag-range-selection-background-color: rgba(212, 175, 55, 0.08);
          --ag-font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
          --ag-text-color: #e0dcc8;
          --ag-foreground-color: #e0dcc8;
          --ag-secondary-foreground-color: #e0dcc8;
          --ag-border-color: rgba(212, 175, 55, 0.15);
          --ag-input-focus-color: #d4af37;
          --ag-input-text-color: #e0dcc8;
          --ag-input-background-color: #1a1712;
          --ag-input-border-color: rgba(212, 175, 55, 0.25);
          --ag-secondary-border-color: rgba(212, 175, 55, 0.15);
          --ag-popup-shadow: 0 4px 20px rgba(0,0,0,0.8);
          background: #111;
        }
        .gold-grid {
          border: 1px solid rgba(212, 175, 55, 0.2);
          background: #111;
          color-scheme: dark;
        }

        .gold-grid * {
          box-sizing: border-box;
        }

        .gold-grid .ag-body-viewport,
        .gold-grid .ag-center-cols-container,
        .gold-grid .ag-body,
        .gold-grid .ag-body-viewport-wrapper,
        .gold-grid .ag-center-cols-viewport,
        .gold-grid .ag-center-cols-scroll-wrapper {
          background: #111 !important;
        }

        .gold-grid .ag-header {
          background: #1a1712 !important;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        .gold-grid .ag-header-cell {
          color: #d4af37 !important;
          font-weight: 600;
          font-size: 0.82rem;
          letter-spacing: 0.3px;
        }
        .gold-grid .ag-header-cell::before {
          background: rgba(212, 175, 55, 0.3) !important;
        }
        .gold-grid .ag-header-icon {
          color: #d4af37;
        }

        .gold-grid .ag-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: #111 !important;
        }
        .gold-grid .ag-row-even {
          background: #111 !important;
        }
        .gold-grid .ag-row-odd {
          background: #151310 !important;
        }
        .gold-grid .ag-row:hover {
          background-color: rgba(212, 175, 55, 0.06) !important;
        }
        .gold-grid .ag-row-selected {
          background-color: rgba(212, 175, 55, 0.1) !important;
        }

        .gold-grid .ag-cell {
          color: #e0dcc8;
          border-right: 1px solid rgba(212, 175, 55, 0.08);
          background: transparent !important;
        }
        .gold-grid .ag-cell-focus {
          border-color: #d4af37 !important;
        }
        .gold-grid .ag-cell-editing {
          background: #1a1712 !important;
        }

        .gold-grid .ag-overlay-no-rows-wrapper {
          color: #8a7e6a;
          font-size: 0.95rem;
        }

        .gold-grid .ag-paging-panel {
          border-top: 1px solid rgba(212, 175, 55, 0.15);
          background: #1a1712;
          color: #8a7e6a;
        }
        .gold-grid .ag-paging-button {
          color: #d4af37;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
        }
        .gold-grid .ag-paging-button:hover {
          background: rgba(212, 175, 55, 0.1);
        }
        .gold-grid .ag-paging-button[disabled] {
          opacity: 0.3;
          cursor: default;
        }
        .gold-grid .ag-paging-page-summary-panel {
          color: #8a7e6a;
        }
        .gold-grid .ag-paging-row-summary-panel {
          color: #8a7e6a;
        }

        .gold-grid .ag-page-size-number-input,
        .gold-grid .ag-paging-panel select,
        .gold-grid .ag-paging-panel input {
          background: #1a1712;
          color: #e0dcc8;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 4px;
          padding: 2px 4px;
        }

        .gold-grid .ag-checkbox-input-wrapper::after {
          border-color: #d4af37;
        }
        .gold-grid .ag-checkbox-input-wrapper.ag-checked::after {
          background-color: #d4af37;
          border-color: #d4af37;
        }

        .gold-grid .ag-cell-editor,
        .gold-grid .ag-popup-editor,
        .gold-grid .ag-popup-editor .ag-cell-editor-popup {
          background: #1a1712 !important;
        }
        .gold-grid .ag-cell-editor input,
        .gold-grid .ag-cell-editor textarea,
        .gold-grid .ag-popup-editor input,
        .gold-grid .ag-popup-editor textarea,
        .gold-grid .ag-input-field-input,
        .gold-grid .ag-cell-editor .ag-input-field-input,
        .gold-grid .ag-large-text-input textarea,
        .gold-grid input.ag-input-field-input,
        .gold-grid textarea.ag-input-field-input,
        .gold-grid .ag-cell input,
        .gold-grid .ag-cell textarea,
        .gold-grid .ag-cell-editor-popup input {
          background-color: #1a1712 !important;
          background: #1a1712 !important;
          color: #e0dcc8 !important;
          border-color: rgba(212, 175, 55, 0.25) !important;
          caret-color: #d4af37 !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .gold-grid .ag-cell-editor input:focus,
        .gold-grid .ag-popup-editor input:focus,
        .gold-grid input.ag-input-field-input:focus,
        .gold-grid textarea.ag-input-field-input:focus,
        .gold-grid .ag-cell input:focus,
        .gold-grid .ag-cell-editor-popup input:focus {
          border-color: #d4af37 !important;
          outline: none !important;
          box-shadow: 0 0 0 1px #d4af37 !important;
        }
        .gold-grid .ag-cell-editor input::placeholder,
        .gold-grid .ag-cell input::placeholder {
          color: #666 !important;
        }
        .gold-grid .ag-input-field-input-wrapper {
          background: #1a1712 !important;
        }
        .gold-grid .ag-cell-editor .ag-input-field {
          background: #1a1712 !important;
        }

        .gold-grid .ag-floating-filter-input input {
          background: #1a1712;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 4px;
          color: #e0dcc8;
          padding: 4px 6px;
          font-size: 0.8rem;
        }
        .gold-grid .ag-floating-filter-input input:focus {
          border-color: #d4af37;
          outline: none;
        }

        .gold-grid .ag-icon {
          color: #d4af37;
        }

        .gold-grid .ag-body-viewport::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .gold-grid .ag-body-viewport::-webkit-scrollbar-track {
          background: #111;
        }
        .gold-grid .ag-body-viewport::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }

        .gold-grid .ag-select-list,
        .gold-grid .ag-popup-child {
          background: #1a1712;
          border: 1px solid rgba(212, 175, 55, 0.25);
        }
        .gold-grid .ag-select-option,
        .gold-grid .ag-popup-child .ag-list-item {
          color: #e0dcc8;
        }
        .gold-grid .ag-select-option:hover,
        .gold-grid .ag-popup-child .ag-list-item:hover {
          background: rgba(212, 175, 55, 0.1);
        }
        .gold-grid .ag-select-option-selected,
        .gold-grid .ag-popup-child .ag-list-item-selected {
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
        }
      `}</style>
    </div>
  );
}
