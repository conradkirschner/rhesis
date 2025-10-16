'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type { UiRecentTestsProps, UiRecentTestsRow } from './types';

const columns: GridColDef<UiRecentTestsRow>[] = [
  { field: 'behaviorName', headerName: 'Behavior', width: 120 },
  { field: 'topicName', headerName: 'Topic', width: 120 },
  { field: 'promptContent', headerName: 'Prompt', flex: 1, minWidth: 100 },
  { field: 'ownerDisplay', headerName: 'Owner', width: 180 },
];

export default function RecentTestsTable(props: UiRecentTestsProps) {
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
    <Box data-test-id="recent-tests-table">
      {errorMessage ? <ErrorBanner message={errorMessage} severity="warning" /> : null}
      <BaseDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        paginationModel={paginationModel as GridPaginationModel}
        onPaginationModelChange={onPaginationModelChange as any}
        loading={loading}
        showToolbar={false}
        density="compact"
        serverSidePagination
        totalRows={totalRows}
        pageSizeOptions={[10, 25, 50]}
        linkPath="/tests"
        linkField="id"
        disableRowSelectionOnClick
        disablePaperWrapper
      />
    </Box>
  );
}