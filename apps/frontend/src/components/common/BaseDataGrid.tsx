// src/components/common/BaseDataGrid.tsx
'use client';

import * as React from 'react';
import {
  DataGrid,
  GridToolbar,
  type DataGridProps,
  type GridColDef,
  type GridPaginationModel,
  type GridValidRowModel,
} from '@mui/x-data-grid';

type ActionButton = {
  href?: string;
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  splitButton?: {
    mainLabel: string;
    options: { label: string; onClick: () => void }[];
  };
};

export type BaseDataGridProps<TRow extends GridValidRowModel = GridValidRowModel> = {
  /** Core */
  rows: readonly TRow[];
  columns: readonly GridColDef<TRow>[];

  /** UX */
  loading?: boolean;
  density?: DataGridProps<TRow>['density'];
  sx?: DataGridProps<TRow>['sx'];

  /** Optional built-in toolbar toggle (shows MUI GridToolbar if true) */
  showToolbar?: boolean;

  /** Optional custom toolbar React node (overrides built-in toolbar if provided) */
  customToolbarContent?: React.ReactNode | null;

  /** Optional link wiring (for callers’ convenience; not rendered here) */
  linkPath?: string;
  linkField?: string;

  /** Pagination (client or server) */
  serverSidePagination?: boolean;
  paginationMode?: DataGridProps<TRow>['paginationMode'];
  paginationModel?: GridPaginationModel;
  /** MUI name is `rowCount`; many callers use `totalRows`—support both */
  rowCount?: number;
  totalRows?: number;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  /** Also commonly passed by callers */
  pageSizeOptions?: readonly number[];

  /** Selection */
  checkboxSelection?: boolean;
  onRowSelectionModelChange?: DataGridProps<TRow>['onRowSelectionModelChange'];
  rowSelectionModel?: DataGridProps<TRow>['rowSelectionModel'];
  disableRowSelectionOnClick?: DataGridProps<TRow>['disableRowSelectionOnClick'];

  /** Identity & row events */
  getRowId?: DataGridProps<TRow>['getRowId'];
  onRowClick?: DataGridProps<TRow>['onRowClick'];

  /** Header actions (not rendered internally; exposed for consumers) */
  actionButtons?: readonly ActionButton[];

  /** Filter passthrough (handy for server filtering) */
  onFilterModelChange?: DataGridProps<TRow>['onFilterModelChange'];

  /** Slots props (v6); accept legacy name `componentsProps` and map it to `slotProps` */
  slotProps?: DataGridProps<TRow>['slotProps'];
  componentsProps?: DataGridProps<TRow>['slotProps'];

  /** Editing (passthrough to MUI) */
  editMode?: DataGridProps<TRow>['editMode'];
  processRowUpdate?: DataGridProps<TRow>['processRowUpdate'];
  onProcessRowUpdateError?: DataGridProps<TRow>['onProcessRowUpdateError'];
  isCellEditable?: DataGridProps<TRow>['isCellEditable'];
  /** Convenience flag to toggle editability without redefining isCellEditable */
  enableEditing?: boolean;

  /** Accepted & ignored (some callers pass this) */
  disablePaperWrapper?: boolean;
};

export default function BaseDataGrid<TRow extends GridValidRowModel = GridValidRowModel>(
    props: BaseDataGridProps<TRow>,
) {
  const {
    rows,
    columns,

    loading,
    density = 'standard',
    sx,

    showToolbar = false,
    customToolbarContent = null,

    serverSidePagination = false,
    paginationMode,
    paginationModel,
    rowCount,
    totalRows,
    onPaginationModelChange,
    pageSizeOptions,

    checkboxSelection,
    onRowSelectionModelChange,
    rowSelectionModel,
    disableRowSelectionOnClick,

    getRowId,
    onRowClick,

    onFilterModelChange,

    slotProps,
    componentsProps, // legacy alias

    // editing
    editMode,
    processRowUpdate,
    onProcessRowUpdateError,
    isCellEditable,
    enableEditing,

    // not rendered here but preserved for API compatibility
    actionButtons,
    linkPath,
    linkField,

    // accepted & ignored
    disablePaperWrapper,
  } = props;

  const resolvedSlotProps = slotProps ?? componentsProps;

  const toolbarSlot = React.useMemo(() => {
    if (customToolbarContent) return () =>  customToolbarContent;
    if (showToolbar) return GridToolbar;
    return undefined;
  }, [customToolbarContent, showToolbar]);

  // Prefer explicit rowCount; fall back to totalRows alias when server-side pagination is enabled.
  const resolvedRowCount =
      serverSidePagination ? (typeof rowCount === 'number' ? rowCount : totalRows) : undefined;

  // If caller didn't provide paginationMode, infer from serverSidePagination.
  const resolvedPaginationMode: DataGridProps<TRow>['paginationMode'] =
      paginationMode ?? (serverSidePagination ? 'server' : 'client');

  const resolvedIsCellEditable = React.useMemo<DataGridProps<TRow>['isCellEditable']>(() => {
    if (enableEditing === false) return () => false;
    return isCellEditable;
  }, [enableEditing, isCellEditable]);

  return (
      <DataGrid
          rows={[...rows] as TRow[]}
          columns={[...columns] as GridColDef<TRow>[]}
          loading={loading}
          density={density}
          sx={sx}
          // Pagination
          paginationMode={resolvedPaginationMode}
          paginationModel={paginationModel}
          rowCount={resolvedRowCount}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={pageSizeOptions}
          // Selection
          checkboxSelection={checkboxSelection}
          onRowSelectionModelChange={onRowSelectionModelChange}
          rowSelectionModel={rowSelectionModel}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          // Identity & events
          getRowId={getRowId}
          onRowClick={onRowClick}
          // Filtering
          onFilterModelChange={onFilterModelChange}
          // Editing
          editMode={editMode}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={onProcessRowUpdateError}
          isCellEditable={resolvedIsCellEditable}
          // Toolbar slot
          slots={{
            toolbar: toolbarSlot,
          }}
          slotProps={resolvedSlotProps}
      />
  );
}
