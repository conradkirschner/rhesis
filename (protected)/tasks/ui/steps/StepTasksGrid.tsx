'use client';

import * as React from 'react';
import { Box, Alert, Avatar, Chip, Typography, ChipProps, Paper } from '@mui/material';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { AddIcon, DeleteIcon } from '@/components/icons';
import { DeleteModal } from '@/components/common/DeleteModal';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';
import { combineTaskFiltersToOData } from '@/utils/odata-filter';
import type { UiTaskRow, UiTasksGridProps } from '../types';

const statusColor = (status: string | null | undefined): ChipProps['color'] => {
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

export default function StepTasksGrid(props: UiTasksGridProps) {
  const {
    rows,
    totalRows,
    pagination,
    onPaginationChange,
    onRowClick,
    selectedRowIds,
    onSelectedRowIdsChange,
    onCreateClick,
    onDeleteSelectedClick,
    onFilterChange,
    isLoading,
    isRefreshing,
    error,
    deleteDialog,
  } = props;

  const handleFilterModelChange = React.useCallback(
    (model: unknown) => {
      // Delegates filter parsing to shared util; emits OData filter string.
      const filter = combineTaskFiltersToOData(model as any);
      onFilterChange(filter || undefined);
    },
    [onFilterChange],
  );

  const columns = React.useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Title',
        width: 300,
        renderCell: (params: { row: UiTaskRow }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.row.title}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        width: 400,
        renderCell: (params: { row: UiTaskRow }) => (
          <Typography
            variant="body2"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
          >
            {params.row.description ?? '-'}
          </Typography>
        ),
      },
      {
        field: 'statusName',
        headerName: 'Status',
        width: 140,
        renderCell: (params: { row: UiTaskRow }) => (
          <Chip label={params.row.statusName ?? 'Unknown'} color={statusColor(params.row.statusName)} size="small" />
        ),
      },
      {
        field: 'assignee',
        headerName: 'Assignee',
        width: 180,
        renderCell: (params: { row: UiTaskRow }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={params.row.assigneePicture ?? undefined}
              alt={params.row.assigneeName ?? 'Unassigned'}
              sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
            >
              {(params.row.assigneeName ?? 'U').charAt(0)}
            </Avatar>
            <Typography variant="body2">{params.row.assigneeName ?? 'Unassigned'}</Typography>
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isRefreshing && !isLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Updating…
        </Alert>
      )}

      <Paper sx={{ p: 0 }}>
        <BaseDataGrid
          rows={rows as UiTaskRow[]}
          columns={columns as any}
          loading={isLoading || isRefreshing}
          onRowClick={(p: { id: string }) => onRowClick(String(p.id))}
          checkboxSelection
          onRowSelectionModelChange={(ids: readonly (string | number)[]) => onSelectedRowIdsChange(ids.map(String))}
          rowSelectionModel={[...selectedRowIds]}
          paginationModel={{ page: pagination.page, pageSize: pagination.pageSize }}
          onPaginationModelChange={(m: { page: number; pageSize: number }) =>
            onPaginationChange({ page: m.page, pageSize: m.pageSize })
          }
          onFilterModelChange={handleFilterModelChange}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowId={(r: UiTaskRow) => r.id}
          disableRowSelectionOnClick
          showToolbar
          serverSidePagination
          totalRows={totalRows}
          serverSideFiltering
          enableQuickFilter
          disablePaperWrapper
          actionButtons={[
            {
              label: 'Create Task',
              onClick: onCreateClick,
              icon: <AddIcon />,
              variant: 'contained',
              color: 'primary',
              'data-test-id': 'create-task',
            },
            ...(selectedRowIds.length > 0
              ? [
                  {
                    label: `Delete (${selectedRowIds.length})`,
                    onClick: onDeleteSelectedClick!,
                    icon: <DeleteIcon />,
                    variant: 'outlined' as const,
                    color: 'error' as const,
                    'data-test-id': 'delete-selected',
                  },
                ]
              : []),
          ]}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        />
      </Paper>

      <DeleteModal
        open={deleteDialog.open}
        onClose={deleteDialog.onCancel}
        onConfirm={deleteDialog.onConfirm}
        isLoading={deleteDialog.isLoading}
        title="Delete Tasks"
        message={`Are you sure you want to delete ${deleteDialog.count} ${
          deleteDialog.count === 1 ? 'task' : 'tasks'
        }? Related data will not be deleted.`}
        itemType="tasks"
      />
    </Box>
  );
}