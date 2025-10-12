'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
} from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { useRouter } from 'next/navigation';
import { Typography, Box, Alert, Avatar, Chip } from '@mui/material';
import { ChatIcon, DescriptionIcon } from '@/components/icons';
import PersonIcon from '@mui/icons-material/Person';
import { useNotifications } from '@/components/common/NotificationContext';
import TestRunDrawer from './TestRunDrawer';
import { DeleteModal } from '@/components/common/DeleteModal';

import type { TestRunDetail } from '@/api-client/types.gen';

import {
  readTestRunsTestRunsGetOptions,
  deleteTestRunTestRunsTestRunIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

type TestRunsTableProps = {
  sessionToken: string;
  onRefresh?: () => void;
};

function TestRunsTable({ sessionToken, onRefresh }: TestRunsTableProps) {
  const isMounted = useRef(true);
  const router = useRouter();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  /* ---------------- List query (server-side pagination) ---------------- */
  const testRunsQuery = useQuery({
    ...readTestRunsTestRunsGetOptions({
      query: {
        skip,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      // if your generator allows, you can pass headers/baseUrl here too
      // headers: { Authorization: `Bearer ${sessionToken}` },
      // baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    }),
    enabled: Boolean(sessionToken),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const rows =
      (testRunsQuery.data as { data?: TestRunDetail[] } | undefined)?.data ?? [];
  const totalCount =
      (
          testRunsQuery.data as
              | { pagination?: { totalCount?: number } }
              | undefined
      )?.pagination?.totalCount ?? 0;

  const errorMessage = (testRunsQuery.error as Error | undefined)?.message ?? null;

  /* ---------------- Delete mutation (correct usage) ---------------- */
  const deleteRunMutation = useMutation({
    // use the generated mutation options; this supplies `mutationFn`
    ...deleteTestRunTestRunsTestRunIdDeleteMutation(),
  });

  /* ---------------- Helpers ---------------- */
  const formatExecutionTime = useMemo(
      () =>
          (timeMs: number): string => {
            const seconds = timeMs / 1000;
            if (seconds < 60) return `${Math.round(seconds)}s`;
            if (seconds < 3600) return `${Math.round((seconds / 60) * 10) / 10}m`;
            return `${Math.round((seconds / 3600) * 10) / 10}h`;
          },
      [],
  );

  const columns: GridColDef[] = useMemo(
      () => [
        {
          field: 'name',
          headerName: 'Name',
          flex: 1,
          valueGetter: (_value, row: TestRunDetail) => row.name ?? '',
        },
        {
          field: 'test_sets',
          headerName: 'Test Sets',
          flex: 1,
          valueGetter: (_value, row: TestRunDetail) =>
              row.test_configuration?.test_set?.name ?? '',
        },
        {
          field: 'total_tests',
          headerName: 'Total Tests',
          flex: 1,
          align: 'right',
          headerAlign: 'right',
          valueGetter: (_value, row: TestRunDetail) =>
              row.attributes?.total_tests ?? 0,
        },
        {
          field: 'execution_time',
          headerName: 'Execution Time',
          flex: 1,
          align: 'right',
          headerAlign: 'right',
          renderCell: (params) => {
            const status = (
                params.row.status?.name ?? params.row.attributes?.status
            )?.toLowerCase();

            if (status === 'progress') return 'In Progress';
            if (status === 'completed') {
              const timeMs = params.row.attributes?.total_execution_time_ms;
              return typeof timeMs === 'number' ? formatExecutionTime(timeMs) : '';
            }
            return '';
          },
        },
        {
          field: 'status',
          headerName: 'Status',
          flex: 1,
          renderCell: (params) => {
            const status = params.row.status?.name;
            return status ? (
                <Chip label={status} size="small" variant="outlined" />
            ) : null;
          },
        },
        {
          field: 'executor',
          headerName: 'Executor',
          flex: 1,
          renderCell: (params) => {
            const executor = params.row.user;
            if (!executor) return null;
            const displayName =
                executor.name ||
                `${executor.given_name ?? ''} ${executor.family_name ?? ''}`.trim() ||
                executor.email ||
                'Unknown';
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={executor.picture ?? undefined} sx={{ width: 24, height: 24 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="body2">{displayName}</Typography>
                </Box>
            );
          },
        },
        {
          field: 'counts.comments',
          headerName: 'Comments',
          width: 100,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            const count = params.row.counts?.comments ?? 0;
            if (!count) return null;
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{count}</Typography>
                </Box>
            );
          },
        },
        {
          field: 'counts.tasks',
          headerName: 'Tasks',
          width: 100,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            const count = params.row.counts?.tasks ?? 0;
            if (!count) return null;
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{count}</Typography>
                </Box>
            );
          },
        },
      ],
      [formatExecutionTime],
  );

  /* ---------------- Handlers ---------------- */
  const handleRowClick = useCallback(
      (params: { id: string | number }) => {
        router.push(`/test-runs/${String(params.id)}`);
      },
      [router],
  );

  const handleSelectionChange = useCallback((newSelection: GridRowSelectionModel) => {
    setSelectedRows(newSelection);
  }, []);

  const handleCreateTestRun = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const refetchList = useCallback(async () => {
    // Invalidate only the generated list query keys
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
          Array.isArray(queryKey) &&
          queryKey.some(
              (q) =>
                  typeof q === 'object' &&
                  q !== null &&
                  (q as { _id?: string })._id === 'readTestRunsTestRunsGet',
          ),
    });
  }, [queryClient]);

  const handleDrawerSuccess = useCallback(async () => {
    await refetchList();
    onRefresh?.();
  }, [onRefresh, refetchList]);

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
    // useQuery will refetch automatically due to `skip/limit` changing.
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!Array.isArray(selectedRows) || selectedRows.length === 0) return;
    setDeleteModalOpen(true);
  }, [selectedRows]);

  const handleDeleteConfirm = useCallback(async () => {
    const ids = Array.isArray(selectedRows) ? selectedRows : [];
    if (!ids.length) return;

    try {
      await Promise.all(
          ids.map((id) =>
              deleteRunMutation.mutateAsync({
                path: { test_run_id: String(id) },
                // include if your API needs them at call-time:
                // headers: { Authorization: `Bearer ${sessionToken}` },
                // baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
              }),
          ),
      );

      notifications.show(
          `Successfully deleted ${ids.length} test run${ids.length === 1 ? '' : 's'}`,
          { severity: 'success' },
      );

      await refetchList();
      setSelectedRows([]);
    } catch {
      notifications.show('Failed to delete test runs', { severity: 'error' });
    } finally {
      setDeleteModalOpen(false);
    }
  }, [selectedRows, deleteRunMutation, notifications, refetchList]);

  const handleDeleteCancel = useCallback(() => setDeleteModalOpen(false), []);

  const actionButtons = useMemo(() => {
    const list: {
      label: string;
      icon: React.ReactNode;
      variant: 'contained' | 'outlined';
      color?: 'error';
      onClick: () => void;
    }[] = [
      {
        label: 'New Test Run',
        icon: <AddIcon />,
        variant: 'contained',
        onClick: handleCreateTestRun,
      },
    ];
    if (Array.isArray(selectedRows) && selectedRows.length > 0) {
      list.push({
        label: 'Delete Test Runs',
        icon: <DeleteIcon />,
        variant: 'outlined',
        color: 'error',
        onClick: handleDeleteSelected,
      });
    }
    return list;
  }, [selectedRows, handleCreateTestRun, handleDeleteSelected]);

  return (
      <>
        {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
        )}

        {Array.isArray(selectedRows) && selectedRows.length > 0 && (
            <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
            >
              <Typography variant="subtitle1" color="primary">
                {selectedRows.length} test run{selectedRows.length === 1 ? '' : 's'} selected
              </Typography>
            </Box>
        )}

        <BaseDataGrid
            rows={rows}
            columns={columns}
            loading={testRunsQuery.isLoading || deleteRunMutation.isPending}
            getRowId={(row: TestRunDetail) => row.id}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={Array.isArray(selectedRows) ? selectedRows : []}
            onRowClick={handleRowClick}
            serverSidePagination
            totalRows={totalCount}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            actionButtons={actionButtons}
            disablePaperWrapper
        />

        <TestRunDrawer
            open={isDrawerOpen}
            onCloseAction={handleDrawerClose}
            sessionToken={sessionToken}
            onSuccessAction={handleDrawerSuccess}
        />

        <DeleteModal
            open={deleteModalOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            isLoading={deleteRunMutation.isPending}
            title="Delete Test Runs"
            message={`Are you sure you want to delete ${
                Array.isArray(selectedRows) ? selectedRows.length : 0
            } test run${
                Array.isArray(selectedRows) && selectedRows.length === 1 ? '' : 's'
            }? Don't worry, related data will not be deleted, only ${
                Array.isArray(selectedRows) && selectedRows.length === 1 ? 'this record' : 'these records'
            }.`}
            itemType="test runs"
        />
      </>
  );
}

export default React.memo(TestRunsTable);
