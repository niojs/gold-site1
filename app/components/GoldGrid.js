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
        className="ag-theme-alpine"
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
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
        />
      </div>
    </div>
  );
}
