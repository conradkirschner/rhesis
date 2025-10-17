'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import { type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { format, parseISO } from 'date-fns';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type { UiRecentActivitiesProps, UiRecentActivitiesRow } from './types';

const columns = [
  { field: 'behaviorName', headerName: 'Behavior', width: 130 },
  { field: 'topicName', headerName: 'Topic', width: 130 },
  {
    field: 'updatedAt',
    headerName: 'Update Time',
    width: 160,
    valueGetter: (_v: unknown, row: UiRecentActivitiesRow) =>
        row.updatedAt ? format(parseISO(row.updatedAt), 'yyyy-MM-dd HH:mm') : '',
  },
  { field: 'assigneeDisplay', headerName: 'Assignee', flex: 1 },
] satisfies readonly GridColDef<UiRecentActivitiesRow>[];

export default function RecentActivitiesTable({
                                                rows,
                                                totalRows,
                                                paginationModel,
                                                onPaginationModelChange,
                                                loading,
                                                errorMessage,
                                              }: UiRecentActivitiesProps) {
  if (loading && rows.length === 0) return <InlineLoader />;

  return (
      <Box data-test-id="recent-activities-table">
        {errorMessage ? <ErrorBanner message={errorMessage} severity="warning" /> : null}
        <BaseDataGrid<UiRecentActivitiesRow>
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            paginationModel={paginationModel as GridPaginationModel}
            onPaginationModelChange={onPaginationModelChange}
            loading={loading}
            density="compact"
            serverSidePagination
            rowCount={totalRows}
            linkPath="/tests"
            linkField="id"
            disablePaperWrapper
        />
      </Box>
  );
}
