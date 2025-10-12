'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Box, Typography, Button, Chip, Avatar, ChipProps } from '@mui/material';
import { AddIcon } from '@/components/icons';
import { Task, EntityType } from '@/types/tasks';
import { getEntityDisplayName } from '@/utils/entity-helpers';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { TaskErrorBoundary } from './TaskErrorBoundary';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';
import { useTasksList } from '@/hooks/useTasks';
import {TaskCreate} from "@/api-client";

interface TasksSectionProps {
  entityType: EntityType;
  entityId: string;
  onCreateTask?: (taskData: TaskCreate) => Promise<void>;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  currentUserId: string;
  currentUserName: string;
}

export function TasksSection({
                               entityType,
                               entityId,
                               onEditTask,
                                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                 // @todo not implemented
                               onDeleteTask,
                             }: TasksSectionProps) {
  const router = useRouter();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const handlePaginationModelChange = useCallback(
      (newModel: GridPaginationModel) => setPaginationModel(newModel),
      []
  );

  const listQueryParams = useMemo(
      () => ({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
        entity_type: entityType,
        entity_id: entityId,
      }),
      [paginationModel.page, paginationModel.pageSize, entityType, entityId]
  );

  const listQuery = useTasksList(listQueryParams, Boolean(entityType && entityId));

  const payload = listQuery?.data;
  const tasks = payload?.data ?? payload?.data ?? [];
  const totalCount: number =
      payload?.pagination?.totalCount ?? payload?.pagination.totalCount ?? tasks.length;

  const loading = listQuery.isLoading;
  const errorMsg = listQuery.isError ? (listQuery.error as Error)?.message ?? 'Failed to fetch tasks' : null;


  const handleRowClick = useCallback(
      (params: GridRowParams<Task>) => {
        try {
          if (onEditTask) {
            onEditTask(String(params.id));
          } else {
            router.push(`/tasks/${params.id}`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Navigation error:', error);
        }
      },
      [onEditTask, router]
  );

  const handleCreateTask = useCallback(() => {
    const queryParams = new URLSearchParams({
      entityType,
      entityId,
    });
    router.push(`/tasks/create?${queryParams.toString()}`);
  }, [router, entityType, entityId]);
  // @todo implement
  // const handleDeleteTask = useCallback(
  //     (taskId: string) => {
  //         if (!onDeleteTask) return;
  //         try {
  //             void onDeleteTask(taskId);
  //         } catch (error) {
  //             // eslint-disable-next-line no-console
  //             console.error('Failed to delete task:', error);
  //         }
  //     },
  //     [onDeleteTask]
  // );
  const getStatusColor = (status?: string): ChipProps['color'] => {
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

  const columns: GridColDef<Task>[] = [
    {
      field: 'title',
      headerName: 'Title',
      width: 300,
      renderCell: (params: GridRenderCellParams<Task>) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.row.title}
          </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 400,
      renderCell: (params: GridRenderCellParams<Task>) => (
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
      renderCell: (params: GridRenderCellParams<Task>) => (
          <Chip
              label={params.row.status?.name || 'Unknown'}
              color={getStatusColor(params.row.status?.name)}
              size="small"
              variant="outlined"
          />
      ),
    },
    {
      field: 'assignee',
      headerName: 'Assignee',
      width: 180,
      renderCell: (params: GridRenderCellParams<Task>) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
                src={params.row.assignee?.picture}
                alt={params.row.assignee?.name || 'Unassigned'}
                sx={{
                  width: AVATAR_SIZES.SMALL,
                  height: AVATAR_SIZES.SMALL,
                  bgcolor: 'primary.main',
                }}
            >
              {params.row.assignee?.name?.charAt(0) ?? 'U'}
            </Avatar>
            <Typography variant="body2">
              {params.row.assignee?.name ?? 'Unassigned'}
            </Typography>
          </Box>
      ),
    },
  ];

  return (
      <TaskErrorBoundary>
        <Box>
          {/* Header */}
          <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
          >
            <Typography variant="h6" component="h2">
              Tasks ({totalCount})
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTask}>
              Create Task
            </Button>
          </Box>

          {/* Tasks Table */}
          {errorMsg ? (
              <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 3 }}>
                {errorMsg}
              </Typography>
          ) : !loading && tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No tasks yet. Create the first task for this {getEntityDisplayName(entityType).toLowerCase()}.
              </Typography>
          ) : (
              <BaseDataGrid
                  rows={tasks}
                  columns={columns}
                  loading={loading}
                  onRowClick={handleRowClick}
                  disableRowSelectionOnClick
                  pageSizeOptions={[5, 10, 25]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={handlePaginationModelChange}
                  getRowId={(row: Task) => row.id}
                  showToolbar
                  disablePaperWrapper
                  serverSidePagination
                  totalRows={totalCount}
                  sx={{
                    '& .MuiDataGrid-row': { cursor: 'pointer' },
                    minHeight: Math.min(tasks.length * 52 + 120, 400),
                  }}
              />
          )}
        </Box>
      </TaskErrorBoundary>
  );
}
