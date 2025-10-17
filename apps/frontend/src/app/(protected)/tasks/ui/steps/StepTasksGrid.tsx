// apps/frontend/src/app/(protected)/tasks/ui/steps/StepTasksGrid.tsx
'use client';

import * as React from 'react';
import {
    Box,
    Alert,
    Avatar,
    Chip,
    Typography,
    ChipProps,
    Paper,
    Button,
    Stack,
} from '@mui/material';
import {
    GridColDef,
    GridEventListener,
    GridToolbarContainer,
    GridToolbarQuickFilter,
} from '@mui/x-data-grid';
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

function TasksToolbar(props: {
    onCreateClick: () => void;
    onDeleteSelectedClick?: () => void;
    selectedCount: number;
}) {
    const { onCreateClick, onDeleteSelectedClick, selectedCount } = props;

    return (
        <GridToolbarContainer>
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ width: '100%', p: 1 }}
            >
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    color="primary"
                    onClick={onCreateClick}
                    data-test-id="create-task"
                >
                    Create Task
                </Button>

                {selectedCount > 0 && onDeleteSelectedClick ? (
                    <Button
                        startIcon={<DeleteIcon />}
                        variant="outlined"
                        color="error"
                        onClick={onDeleteSelectedClick}
                        data-test-id="delete-selected"
                    >
                        Delete ({selectedCount})
                    </Button>
                ) : null}

                <Box sx={{ flex: 1 }} />

                {/* Quick filter connected to DataGrid's filterModel */}
                <GridToolbarQuickFilter />
            </Stack>
        </GridToolbarContainer>
    );
}

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

    const columns = React.useMemo<readonly GridColDef<UiTaskRow>[]>(
        () => [
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
                        {params.row.description ?? '-'}
                    </Typography>
                ),
            },
            {
                field: 'statusName',
                headerName: 'Status',
                width: 140,
                renderCell: (params) => (
                    <Chip
                        label={params.row.statusName ?? 'Unknown'}
                        color={statusColor(params.row.statusName)}
                        size="small"
                    />
                ),
            },
            {
                field: 'assignee',
                headerName: 'Assignee',
                width: 200,
                sortable: false,
                filterable: false,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            src={params.row.assigneePicture ?? undefined}
                            alt={params.row.assigneeName ?? 'Unassigned'}
                            sx={{
                                width: AVATAR_SIZES.SMALL,
                                height: AVATAR_SIZES.SMALL,
                                bgcolor: 'primary.main',
                            }}
                        >
                            {(params.row.assigneeName ?? 'U').charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                            {params.row.assigneeName ?? 'Unassigned'}
                        </Typography>
                    </Box>
                ),
            },
        ],
        [],
    );

    // Proper MUI DataGrid typing for row click
    const handleRowClick: GridEventListener<'rowClick'> = (params) => {
        // params.id is GridRowId (string | number | any); normalize to string for routes
        onRowClick(String(params.id));
    };

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
                <BaseDataGrid<UiTaskRow>
                    rows={rows}
                    columns={columns}
                    loading={isLoading || isRefreshing}
                    // Typed row click handler
                    onRowClick={handleRowClick}
                    // Selection
                    checkboxSelection
                    onRowSelectionModelChange={(ids) =>
                        onSelectedRowIdsChange(
                            (ids as readonly (string | number)[]).map(String),
                        )
                    }
                    rowSelectionModel={[...selectedRowIds]}
                    // Pagination (server-side)
                    serverSidePagination
                    paginationModel={{
                        page: pagination.page,
                        pageSize: pagination.pageSize,
                    }}
                    onPaginationModelChange={(m) =>
                        onPaginationChange({ page: m.page, pageSize: m.pageSize })
                    }
                    // Filtering
                    onFilterModelChange={handleFilterModelChange}
                    // Identity
                    getRowId={(r) => r.id}
                    // DataGrid toolbar (custom)
                    customToolbarContent={
                        <TasksToolbar
                            onCreateClick={onCreateClick}
                            onDeleteSelectedClick={onDeleteSelectedClick}
                            selectedCount={selectedRowIds.length}
                        />
                    }
                    // Row count for server-side pagination
                    rowCount={totalRows}
                    // Styling
                    slotProps={undefined}
                    componentsProps={undefined}
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
