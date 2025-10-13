'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowParams,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { Typography, Box, Alert, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {useQuery, useMutation, keepPreviousData} from '@tanstack/react-query';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/common/NotificationContext';

import type { TestDetail } from '@/api-client/types.gen';


import {
  getTestSetTestsTestSetsTestSetIdentifierTestsGetOptions,
  disassociateTestsFromTestSetTestSetsTestSetIdDisassociatePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface TestSetTestsGridProps {
  testSetId: string;
  onRefresh?: () => void;
}

type Row = TestDetail;

export default function TestSetTestsGrid({
                                           testSetId,
                                           onRefresh,
                                         }: TestSetTestsGridProps) {
  const router = useRouter();
  const notifications = useNotifications();

  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });

  const testsQuery = useQuery({
    ...getTestSetTestsTestSetsTestSetIdentifierTestsGetOptions(
        {
          path: { test_set_identifier: testSetId },
          query: {
            skip: paginationModel.page * paginationModel.pageSize,
            limit: paginationModel.pageSize,
            order_by: 'topic',
            order: 'asc',
          },
        },
    ),
    enabled: Boolean(testSetId),
    // optional cache tuning:
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  // Normalize response shape: either T[] or { data: T[], pagination: { totalCount } }
  const { rows, totalCount } = useMemo(() => {
    const raw = testsQuery.data as
        | Row[]
        | { data?: Row[]; pagination?: { totalCount?: number } }
        | undefined;

    if (!raw) return { rows: [] as Row[], totalCount: 0 };

    if (Array.isArray(raw)) {
      return { rows: raw, totalCount: raw.length };
    }
    const data = Array.isArray(raw.data) ? raw.data : [];
    const total =
        typeof raw.pagination?.totalCount === 'number'
            ? raw.pagination.totalCount
            : data.length;
    return { rows: data, totalCount: total };
  }, [testsQuery.data]);

  const disassociateMutation = useMutation({
    ...disassociateTestsFromTestSetTestSetsTestSetIdDisassociatePostMutation(
    ),
    onSuccess: () => {
      notifications.show(
          `Successfully removed ${selectedRows.length} ${
              selectedRows.length === 1 ? 'test' : 'tests'
          } from test set`,
          { severity: 'success', autoHideDuration: 6000 },
      );
      setSelectedRows([]);
      testsQuery.refetch();
      onRefresh?.();
    },
    onError: () => {
      notifications.show('Failed to remove tests from test set', {
        severity: 'error',
        autoHideDuration: 6000,
      });
    },
  });

  const columns: GridColDef<Row>[] = useMemo(
      () => [
        {
          field: 'prompt',
          headerName: 'Prompt',
          flex: 3,
          renderCell: (params: GridRenderCellParams<Row>) => {
            const content = params.row.prompt?.content ?? '';
            if (!content) return null;
            return (
                <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                    title={content}
                >
                  {content}
                </Typography>
            );
          },
        },
        {
          field: 'behavior',
          headerName: 'Behavior',
          flex: 1,
          renderCell: (params: GridRenderCellParams<Row>) => {
            const behaviorName = params.row.behavior?.name;
            return behaviorName ? (
                <Chip label={behaviorName} variant="outlined" size="small" />
            ) : null;
          },
        },
        {
          field: 'topic',
          headerName: 'Topic',
          flex: 1,
          renderCell: (params: GridRenderCellParams<Row>) => {
            const topicName = params.row.topic?.name;
            return topicName ? (
                <Chip label={topicName} variant="outlined" size="small" />
            ) : null;
          },
        },
      ],
      [],
  );

  const handlePaginationModelChange = useCallback(
      (newModel: GridPaginationModel) => setPaginationModel(newModel),
      [],
  );

  const handleRowClick = useCallback(
      (params: GridRowParams<Row>) => {
        const testId = String(params.id);
        router.push(`/tests/${encodeURIComponent(testId)}`);
      },
      [router],
  );

  const handleSelectionChange = useCallback(
      (newSelection: GridRowSelectionModel) => setSelectedRows(newSelection),
      [],
  );

  const handleRemoveTests = useCallback(() => {
    if (!selectedRows.length) return;
    disassociateMutation.mutate({
      path: { test_set_id: testSetId },
      body: { test_ids: selectedRows as string[] },
    });
  }, [disassociateMutation, selectedRows, testSetId]);

  const actionButtons = useMemo(() => {
    const buttons: Array<{
      label: string;
      icon: React.ReactNode;
      variant: 'outlined' | 'contained' | 'text';
      color?: 'error' | 'primary' | 'secondary' | 'inherit' | 'success' | 'info' | 'warning';
      onClick: () => void;
      disabled?: boolean;
    }> = [];

    if (selectedRows.length > 0) {
      buttons.push({
        label: `Remove ${selectedRows.length} ${
            selectedRows.length === 1 ? 'Test' : 'Tests'
        }`,
        icon: <DeleteIcon />,
        variant: 'outlined',
        color: 'error',
        onClick: handleRemoveTests,
        disabled: disassociateMutation.isPending,
      });
    }

    return buttons;
  }, [handleRemoveTests, selectedRows.length, disassociateMutation.isPending]);

  return (
      <>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tests
        </Typography>

        {testsQuery.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(testsQuery.error as Error).message || 'Failed to load tests'}
            </Alert>
        )}

        {selectedRows.length > 0 && (
            <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
            >
              <Typography variant="subtitle1" color="primary">
                {selectedRows.length} tests selected
              </Typography>
            </Box>
        )}

        <BaseDataGrid
            rows={rows}
            columns={columns}
            loading={testsQuery.isFetching || disassociateMutation.isPending}
            getRowId={(row) => row.id}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            actionButtons={actionButtons}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={selectedRows}
            onRowClick={handleRowClick}
            serverSidePagination
            totalRows={totalCount}
            pageSizeOptions={[10, 25, 50]}
            disablePaperWrapper
        />
      </>
  );
}
