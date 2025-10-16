'use client';

import React, { useMemo, useState } from 'react';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { useQuery } from '@tanstack/react-query';

import { readTestSetsTestSetsGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type { TestSet } from '@/api-client/types.gen';

export default function RecentTestSetsGrid() {
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 10,
  });

  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  const queryOptions = useMemo(
      () =>
          readTestSetsTestSetsGetOptions({
            query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
          }),
      [skip, limit]
  );

  const { data, isLoading, isFetching, error } = useQuery(queryOptions);

  const rows = data?.data ?? [];

  const totalRows = data?.pagination.totalCount;

  const loading = isLoading || isFetching;

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  };

  const testSetsColumns: GridColDef<TestSet>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 220,
      valueGetter: (_v, row) => row.short_description ?? row.description ?? 'No description',
    },
    {
      field: 'visibility',
      headerName: 'Visibility',
      width: 120,
      valueGetter: (_v, row) => {
        if (row.visibility) {
          return row.visibility.charAt(0).toUpperCase() + row.visibility.slice(1);
        }
        return row.is_published ? 'Public' : 'Private';
      },
      renderCell: (params: GridRenderCellParams<TestSet, string>) => (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">{params.value}</Typography>
          </Box>
      ),
    },
  ];

  if (loading && rows.length === 0) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
    );
  }

  return (
      <Box>
        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
        )}

        <BaseDataGrid
            rows={rows}
            columns={testSetsColumns}
            getRowId={(row: TestSet) =>
             String(row.id ?? row.nano_id ?? `${row.name}`)
            }
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
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
