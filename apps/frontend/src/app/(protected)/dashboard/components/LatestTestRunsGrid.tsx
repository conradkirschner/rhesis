'use client';

import React, { useMemo, useState } from 'react';
import { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert } from '@mui/material';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { format, parseISO } from 'date-fns';

import { useQuery } from '@tanstack/react-query';
import { readTestsTestsGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type { TestDetail } from '@/api-client/types.gen';

const recentActivitiesColumns: GridColDef<TestDetail>[] = [
  {
    field: 'behavior',
    headerName: 'Behavior',
    width: 130,
    valueGetter: (_v, row) => row.behavior?.name ?? 'Unspecified',
  },
  {
    field: 'topic',
    headerName: 'Topic',
    width: 130,
    valueGetter: (_v, row) => row.topic?.name ?? 'Uncategorized',
  },
  {
    field: 'timestamp',
    headerName: 'Update Time',
    width: 150,
    valueGetter: (_v, row) =>
        row.updated_at ? format(parseISO(row.updated_at), 'yyyy-MM-dd HH:mm') : '',
  },
  {
    field: 'assignee',
    headerName: 'Assignee',
    flex: 1,
    valueGetter: (_v, row) => {
      const a = row.assignee;
      if (!a) return 'No assignee';
      if (a.name) return a.name;
      const full = [a.given_name, a.family_name].filter(Boolean).join(' ');
      return full || a.email || 'No contact info';
    },
  },
];

export default function RecentActivitiesGrid() {
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 10,
  });

  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  // Build options from the generated helper (do not spread/augment when calling useQuery)
  const queryOptions = useMemo(
      () =>
          readTestsTestsGetOptions({
            query: { skip, limit, sort_by: 'updated_at', sort_order: 'desc' },
          }),
      [skip, limit]
  );

  // Pass the options object directly to useQuery (prevents TS overload issues)
  const { data, isLoading, isFetching, error } = useQuery(queryOptions);

  // Current backend returns a plain array for 200
  const rows: TestDetail[] = data?.data ?? [];

  const totalRows = data?.pagination.totalCount;

  const loading = isLoading || isFetching;

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  };

  if (loading && rows.length === 0) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
    );
  }

  return (
      <Box>
        {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
        )}
        <BaseDataGrid
            rows={rows}
            columns={recentActivitiesColumns}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
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
