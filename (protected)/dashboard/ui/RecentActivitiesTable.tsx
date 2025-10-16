'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { format, parseISO } from 'date-fns';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type { UiRecentActivitiesProps, UiRecentActivitiesRow } from './types';

const columns: GridColDef<UiRecentActivitiesRow>[] = [
  { field: 'behaviorName', headerName: 'Behavior', width: 130 },
  { field: 'topicName', headerName: 'Topic', width: 130 },
  {
    field: 'updatedAt',
    headerName: 'Update Time',
    width: 160,
    valueGetter: (_v, row) => (row.updatedAt ? format(parseISO(row.updatedAt), 'yyyy-MM-dd HH:mm') : ''),
  },
  { field: 'assigneeDisplay', headerName: 'Assignee', flex: 1 },
];

export default function RecentActivitiesTable(props: UiRecentActivitiesProps) {
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
    <Box data-test-id="recent-activities-table">
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