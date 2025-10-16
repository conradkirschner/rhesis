'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type { UiRecentTestSetsProps, UiRecentTestSetsRow } from './types';

const columns: GridColDef<UiRecentTestSetsRow>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'description', headerName: 'Description', width: 220 },
  {
    field: 'visibility',
    headerName: 'Visibility',
    width: 120,
    renderCell: (params: GridRenderCellParams<UiRecentTestSetsRow, string>) => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2">{params.value}</Typography>
      </Box>
    ),
  },
];

export default function RecentTestSetsTable(props: UiRecentTestSetsProps) {
  const {
    rows,
    totalRows,
    paginationModel,
    onPaginationModelChange,
    loading,
    errorMessage,
  } = props;

  if (loading && rows.length === 0) return <InlineLoader />;

  return (
    <Box data-test-id="recent-test-sets-table">
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      <BaseDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        paginationModel={paginationModel as GridPaginationModel}
        onPaginationModelChange={onPaginationModelChange as any}
        loading={loading}
        showToolbar={false}
        density="compact"
        linkPath="/test-sets"
        linkField="id"
        serverSidePagination
        totalRows={totalRows}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        disablePaperWrapper
      />
    </Box>
  );
}