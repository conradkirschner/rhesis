'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import PersonIcon from '@mui/icons-material/Person';
import {
    GridColDef,
    GridPaginationModel,
    GridRowSelectionModel,
} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import {
    Autocomplete,
    Divider,
    Stack,
    TextField,
} from '@mui/material';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import { ChatIcon, DescriptionIcon } from '@/components/icons';
import { DeleteModal } from '@/components/common/DeleteModal';
import BaseDrawer from '@/components/common/BaseDrawer';

import type { UiLookups, UiPaginationModel, UiTestRunRow } from '../types';

type Props = {
    readonly rows: readonly UiTestRunRow[];
    readonly totalRows: number;
    readonly page: number;
    readonly pageSize: number;
    readonly loading: boolean;
    readonly errorMessage: string | null;
    readonly onPaginationChange: (model: UiPaginationModel) => void;
    readonly onRowClick: (id: string) => void; // IDs are strings in the frontend
    readonly onDeleteSelected: (ids: readonly string[]) => Promise<void>; // IDs as strings
    readonly lookups: UiLookups;
    readonly drawerOpen: boolean;
    readonly onDrawerClose: () => void;
};

export default function StepRunsTable(props: Props) {
    const {
        rows,
        totalRows,
        page,
        pageSize,
        loading,
        errorMessage,
        onPaginationChange,
        onRowClick,
        onDeleteSelected,
        lookups,
        drawerOpen,
        onDrawerClose,
    } = props;

    const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const paginationModel = useMemo<GridPaginationModel>(
        () => ({ page, pageSize }),
        [page, pageSize],
    );

    const columns: GridColDef<UiTestRunRow>[] = useMemo(
        () => [
            { field: 'name', headerName: 'Name', flex: 1 },
            { field: 'testSetName', headerName: 'Test Sets', flex: 1 },
            {
                field: 'totalTests',
                headerName: 'Total Tests',
                flex: 1,
                align: 'right',
                headerAlign: 'right',
                valueGetter: (_v, row) => row.totalTests,
            },
            {
                field: 'executionTime',
                headerName: 'Execution Time',
                flex: 1,
                align: 'right',
                headerAlign: 'right',
                renderCell: (params) => {
                    const status = params.row.status?.toLowerCase() ?? '';
                    if (status === 'progress') return 'In Progress';
                    if (status === 'completed') {
                        const ms = params.row.totalExecutionTimeMs ?? 0;
                        const seconds = ms / 1000;
                        if (seconds < 60) return `${Math.round(seconds)}s`;
                        if (seconds < 3600) return `${Math.round((seconds / 60) * 10) / 10}m`;
                        return `${Math.round((seconds / 3600) * 10) / 10}h`;
                    }
                    return '';
                },
            },
            {
                field: 'status',
                headerName: 'Status',
                flex: 1,
                renderCell: (params) =>
                    params.row.status ? (
                        <Chip label={params.row.status} size="small" variant="outlined" />
                    ) : null,
            },
            {
                field: 'executor',
                headerName: 'Executor',
                flex: 1,
                renderCell: (params) => {
                    const name = params.row.executor?.displayName;
                    const avatarUrl = params.row.executor?.picture ?? undefined;
                    if (!name) return null;
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={avatarUrl} sx={{ width: 24, height: 24 }}>
                                <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2">{name}</Typography>
                        </Box>
                    );
                },
            },
            {
                field: 'comments',
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
                field: 'tasks',
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
        [],
    );

    const handlePaginationModelChange = (model: GridPaginationModel) => {
        onPaginationChange({ page: model.page, pageSize: model.pageSize });
    };

    const handleDeleteSelected = () => {
        if (!Array.isArray(selectedRows) || selectedRows.length === 0) return;
        setDeleteModalOpen(true);
    };

    const actionButtons = useMemo(
        () =>
            [
                {
                    label: 'Delete Test Runs',
                    variant: 'outlined' as const,
                    color: 'error' as const,
                    onClick: handleDeleteSelected,
                    'data-test-id': 'delete-test-runs',
                },
            ] as const,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedRows.length],
    );

    return (
        <>
            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
                </Alert>
            )}

            <Paper sx={{ width: '100%', mb: 2, mt: 2 }}>
                <Box sx={{ p: 2 }}>
                    <BaseDataGrid<UiTestRunRow>
                        rows={rows as UiTestRunRow[]}
                        columns={columns}
                        loading={loading}
                        getRowId={(row) => row.id} // ids are strings
                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        onRowSelectionModelChange={setSelectedRows}
                        rowSelectionModel={Array.isArray(selectedRows) ? selectedRows : []}
                        onRowClick={(params) => onRowClick(String(params.id))}
                        serverSidePagination
                        rowCount={totalRows}
                        pageSizeOptions={[10, 25, 50]}
                        checkboxSelection
                        disableRowSelectionOnClick
                        actionButtons={actionButtons}
                        disablePaperWrapper
                    />
                </Box>
            </Paper>

            <DeleteModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={async () => {
                    const ids = (Array.isArray(selectedRows) ? selectedRows : []).map(String);
                    await onDeleteSelected(ids);
                    setSelectedRows([]);
                    setDeleteModalOpen(false);
                }}
                isLoading={loading}
                title="Delete Test Runs"
                message={`Are you sure you want to delete ${
                    Array.isArray(selectedRows) ? selectedRows.length : 0
                } test run${
                    Array.isArray(selectedRows) && selectedRows.length === 1 ? '' : 's'
                }?`}
                itemType="test runs"
            />

            {/* Create / Execute Drawer (presentational only; receives lookups from container) */}
            <BaseDrawer
                open={drawerOpen}
                onClose={onDrawerClose}
                title="Test Run Configuration"
                loading={lookups.isLoading}
                error={lookups.errorMessage ?? undefined}
                onSave={() => {
                    // Container manages mutations; presentational no-op
                    onDrawerClose();
                }}
                saveButtonText="Execute Now"
            >
                <Stack spacing={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Workflow
                    </Typography>
                    <Stack spacing={2}>
                        <Autocomplete
                            options={lookups.users}
                            getOptionLabel={(u) =>
                                u?.name ||
                                `${u?.given_name ?? ''} ${u?.family_name ?? ''}`.trim() ||
                                u?.email ||
                                'Unknown'
                            }
                            renderInput={(params) => <TextField {...params} label="Assignee" />}
                        />
                        <Autocomplete
                            options={lookups.users}
                            getOptionLabel={(u) =>
                                u?.name ||
                                `${u?.given_name ?? ''} ${u?.family_name ?? ''}`.trim() ||
                                u?.email ||
                                'Unknown'
                            }
                            renderInput={(params) => <TextField {...params} label="Owner" required />}
                        />
                    </Stack>

                    <Divider />

                    <Typography variant="subtitle2" color="text.secondary">
                        Test Run Configuration
                    </Typography>
                    <Stack spacing={2}>
                        <Autocomplete
                            options={lookups.testSets}
                            getOptionLabel={(o) => o.name || 'Unnamed Test Set'}
                            renderInput={(params) => <TextField {...params} label="Test Set" required />}
                        />
                        <Autocomplete
                            options={lookups.projects}
                            getOptionLabel={(o) => o.name ?? 'Unnamed Project'}
                            renderInput={(params) => <TextField {...params} label="Application" required />}
                        />
                        <Autocomplete
                            options={lookups.endpoints}
                            getOptionLabel={(o) => `${o.name} (${o.environment ?? 'env'})`}
                            renderInput={(params) => <TextField {...params} label="Endpoint" required />}
                        />
                    </Stack>
                </Stack>
            </BaseDrawer>
        </>
    );
}
