'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Alert,
  Chip,
  Button,
  Avatar,
  ChipProps
} from '@mui/material';
import {
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
  GridFilterModel,
  GridRowParams,
} from '@mui/x-data-grid';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import { AddIcon, DeleteIcon } from '@/components/icons';
import { useNotifications } from '@/components/common/NotificationContext';
import { DeleteModal } from '@/components/common/DeleteModal';
import { combineTaskFiltersToOData } from '@/utils/odata-filter';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';

import { useQuery, useMutation } from '@tanstack/react-query';

import type { TaskDetail, PaginatedTaskDetail } from '@/api-client/types.gen';
import {
  listTasksTasksGetOptions,
  deleteTaskTasksTaskIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface TasksGridProps {
  onRefresh?: () => void;
}

export default function TasksGrid({ onRefresh }: TasksGridProps) {
  const router = useRouter();
  const notifications = useNotifications();

  const [selectedRows, setSelectedRows] = React.useState<GridRowSelectionModel>([]);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({ items: [] });
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const skip = React.useMemo(
      () => paginationModel.page * paginationModel.pageSize,
      [paginationModel.page, paginationModel.pageSize]
  );

  const oDataFilter = React.useMemo(
      () => combineTaskFiltersToOData(filterModel),
      [filterModel]
  );

  // ---- List tasks (paginated) ----
  const tasksQuery = useQuery({
    ...listTasksTasksGetOptions({
      query: {
        skip,
        limit: paginationModel.pageSize,
        $filter: oDataFilter,
      },
    }),
    placeholderData: (prev) => prev, // v5 replacement for keepPreviousData
    staleTime: 60_000,
  });

  const page: PaginatedTaskDetail | undefined = tasksQuery.data;
  const tasks: TaskDetail[] = page?.data ?? [];
  const totalCount: number = page?.pagination?.totalCount ?? 0;
  const loading = tasksQuery.isLoading || tasksQuery.isFetching;

  // ---- Delete mutation ----
  const deleteTaskMutation = useMutation({
    ...deleteTaskTasksTaskIdDeleteMutation(),
  });

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedRows.length === 0) return;
    setDeleteModalOpen(true);
  }, [selectedRows.length]);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (selectedRows.length === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(
          selectedRows.map((id) =>
              deleteTaskMutation.mutateAsync({ path: { task_id: String(id) } })
          )
      );

      notifications.show('Task(s) deleted successfully', { severity: 'success' });
      setSelectedRows([]);
      setDeleteModalOpen(false);
      onRefresh?.();
      void tasksQuery.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete tasks';
      notifications.show(msg, { severity: 'error' });
      setDeleteModalOpen(false);
      void tasksQuery.refetch();
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRows, deleteTaskMutation, notifications, onRefresh, tasksQuery]);

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleRowClick = React.useCallback(
      (params: GridRowParams<TaskDetail>) => {
        router.push(`/tasks/${params.id}`);
      },
      [router]
  );

  const handlePaginationModelChange = React.useCallback(
      (newModel: GridPaginationModel) => {
        setPaginationModel(newModel);
      },
      []
  );

  const handleFilterModelChange = React.useCallback((newModel: GridFilterModel) => {
    setFilterModel(newModel);
  }, []);

  // ---- Helpers ----
  const getStatusColor = (status: string | null | undefined): ChipProps['color'] => {
    switch (status) {
      case 'Open':
        return 'warning';
      case 'In Progress':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // ---- Columns ----
  const columns = React.useMemo<GridColDef<TaskDetail>[]>(() => [
    {
      field: 'title',
      headerName: 'Title',
      width: 300,
      renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.row.title}
          </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 400,
      renderCell: (params) => (
          <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
          >
            {params.row.description || '-'}
          </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
          <Chip
              label={params.row.status?.name || 'Unknown'}
              color={getStatusColor(params.row.status?.name)}
              size="small"
          />
      ),
    },
    {
      field: 'assignee',
      headerName: 'Assignee',
      width: 180,
      renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
                src={params.row.assignee?.picture ?? undefined}
                alt={params.row.assignee?.name || 'Unassigned'}
                sx={{
                  width: AVATAR_SIZES.SMALL,
                  height: AVATAR_SIZES.SMALL,
                  bgcolor: 'primary.main',
                }}
            >
              {params.row.assignee?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="body2">
              {params.row.assignee?.name || 'Unassigned'}
            </Typography>
          </Box>
      ),
    },
  ], []);

  // ---- Early error (no cached data) state ----
  if (tasksQuery.isError && !tasksQuery.data) {
    const msg = tasksQuery.error.message;

    return (
        <Box>
          <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button
                    color="inherit"
                    size="small"
                    onClick={() => tasksQuery.refetch()}
                    disabled={tasksQuery.isFetching}
                >
                  Retry
                </Button>
              }
          >
            {msg}
          </Alert>

          <BaseDataGrid
              rows={[]}
              columns={columns}
              loading={loading}
              onRowClick={handleRowClick}
              checkboxSelection
              onRowSelectionModelChange={setSelectedRows}
              rowSelectionModel={selectedRows}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onFilterModelChange={handleFilterModelChange}
              pageSizeOptions={[10, 25, 50, 100]}
              getRowId={(row) => row.id as string}
              disableRowSelectionOnClick
              showToolbar
              serverSidePagination
              totalRows={0}
              serverSideFiltering
              enableQuickFilter
              disablePaperWrapper
              actionButtons={[
                {
                  label: 'Create Task',
                  onClick: () => router.push('/tasks/create'),
                  icon: <AddIcon />,
                  variant: 'contained',
                  color: 'primary',
                },
              ]}
              sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        </Box>
    );
  }

  return (
      <Box>
        {tasksQuery.isError && tasksQuery.data && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Failed to refresh tasks — showing last loaded results.
            </Alert>
        )}

        <BaseDataGrid
            rows={tasks}
            columns={columns}
            loading={loading}
            onRowClick={handleRowClick}
            checkboxSelection
            onRowSelectionModelChange={setSelectedRows}
            rowSelectionModel={selectedRows}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            onFilterModelChange={handleFilterModelChange}
            pageSizeOptions={[10, 25, 50, 100]}
            getRowId={(row) => row.id as string}
            disableRowSelectionOnClick
            showToolbar
            serverSidePagination
            totalRows={totalCount}
            serverSideFiltering
            enableQuickFilter
            disablePaperWrapper
            actionButtons={[
              {
                label: 'Create Task',
                onClick: () => router.push('/tasks/create'),
                icon: <AddIcon />,
                variant: 'contained',
                color: 'primary',
              },
              ...(selectedRows.length > 0
                  ? [
                    {
                      label: `Delete (${selectedRows.length})`,
                      onClick: handleDeleteSelected,
                      icon: <DeleteIcon />,
                      variant: 'outlined' as const,
                      color: 'error' as const,
                    },
                  ]
                  : []),
            ]}
            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        />

        <DeleteModal
            open={deleteModalOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            isLoading={isDeleting}
            title="Delete Tasks"
            message={`Are you sure you want to delete ${selectedRows.length} ${
                selectedRows.length === 1 ? 'task' : 'tasks'
            }? Related data will not be deleted.`}
            itemType="tasks"
        />
      </Box>
  );
}
