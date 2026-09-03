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
    if (!confirm(`Удалить ${selected.length} записей?`)) return;
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
        className="ag-theme-alpine-dark gold-grid"
        style={{ flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
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
      {onSave && (
        <button
          className="btn-gold"
          onClick={onSave}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            padding: '0.7rem 1.8rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(212,175,55,0.4)',
            zIndex: 999,
            cursor: 'pointer',
          }}
        >
          {saveLabel || 'Сохранить'}
        </button>
      )}
      <style jsx global>{`
        .gold-grid {
          --ag-background-color: #111;
          --ag-header-background-color: #1a1712;
          --ag-odd-row-background-color: #151310;
          --ag-row-hover-color: rgba(212, 175, 55, 0.08);
          --ag-selected-row-background-color: rgba(212, 175, 55, 0.15);
          --ag-range-selection-background-color: rgba(212, 175, 55, 0.1);
          --ag-font-family: 'Segoe UI', system-ui, sans-serif;
          --ag-text-color: #e0dcc8;
          --ag-foreground-color: #e0dcc8;
          --ag-secondary-foreground-color: #e0dcc8;
          --ag-border-color: rgba(212, 175, 55, 0.15);
          --ag-input-focus-color: #d4af37;
          --ag-input-text-color: #e0dcc8;
          --ag-input-background-color: #1a1712;
          --ag-input-border-color: rgba(212, 175, 55, 0.3);
          --ag-secondary-border-color: rgba(212, 175, 55, 0.15);
          --ag-popup-shadow: 0 4px 20px rgba(0,0,0,0.8);
          --ag-alpine-active-color: #d4af37;
          color-scheme: dark;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .gold-grid .ag-header-cell-label .ag-header-cell-text {
          color: #d4af37 !important;
          font-weight: 600;
        }
        .gold-grid .ag-header-icon {
          color: #d4af37 !important;
        }

        .gold-grid .ag-cell {
          border-right: 1px solid rgba(212, 175, 55, 0.06);
        }

        .gold-grid .ag-paging-panel {
          border-top: 1px solid rgba(212, 175, 55, 0.15);
        }
        .gold-grid .ag-paging-button {
          color: #d4af37;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .gold-grid .ag-paging-button:hover {
          background: rgba(212, 175, 55, 0.1);
        }
        .gold-grid .ag-paging-button[disabled] {
          opacity: 0.3;
        }

        .gold-grid .ag-checkbox-input-wrapper::after {
          border-color: #d4af37;
        }
        .gold-grid .ag-checkbox-input-wrapper.ag-checked::after {
          background-color: #d4af37;
          border-color: #d4af37;
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
          border-color: rgba(212, 175, 55, 0.25);
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

        .gold-grid .ag-overlay-no-rows-wrapper {
          color: #8a7e6a;
        }
      `}</style>
    </div>
  );
}
