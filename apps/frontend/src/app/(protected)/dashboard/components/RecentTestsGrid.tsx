'use client';

import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { useQuery } from '@tanstack/react-query';

import { readTestsTestsGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type { TestDetail } from '@/api-client/types.gen';

interface RecentTestsGridProps {
  sessionToken: string; // retained for signature compatibility (not needed if HeyApiAuthProvider sets auth)
}

export default function RecentTestsGrid(_props: RecentTestsGridProps) {
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 10,
  });

  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  // Build options with the generator helper (do NOT augment when calling useQuery)
  const queryOptions = useMemo(
      () =>
          readTestsTestsGetOptions({
            query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
          }),
      [skip, limit]
  );

  // Pass options directly to useQuery to keep the generator's queryKey/queryFn types intact
  const { data, isLoading, isFetching, error } = useQuery(queryOptions);

  // Current backend returns a plain array for 200
  const rows: TestDetail[] = data?.data ?? [];

  const totalRows = data?.pagination.totalCount;

  const loading = isLoading || isFetching;

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  };

  const testColumns: GridColDef<TestDetail>[] = [
    {
      field: 'behavior',
      headerName: 'Behavior',
      width: 120,
      valueGetter: (_v, row) => row.behavior?.name ?? 'Unspecified',
    },
    {
      field: 'topic',
      headerName: 'Topic',
      width: 120,
      valueGetter: (_v, row) => row.topic?.name ?? 'Uncategorized',
    },
    {
      field: 'prompt',
      headerName: 'Prompt',
      flex: 1,
      minWidth: 100,
      valueGetter: (_v, row) => row.prompt?.content ?? 'No prompt',
    },
    {
      field: 'owner_email',
      headerName: 'Owner',
      width: 180,
      valueGetter: (_v, row) => {
        const owner = row.owner;
        if (!owner) return 'No owner';
        if (owner.name) return owner.name;
        const full = [owner.given_name, owner.family_name].filter(Boolean).join(' ');
        return full || owner.email || 'No contact info';
      },
    },
  ];

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
            columns={testColumns}
            getRowId={(row: TestDetail) =>
                String(row.id ?? (row as { nano_id?: string }).nano_id ?? `${row.prompt?.content ?? 'row'}-${row.created_at ?? ''}`)
            }
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
