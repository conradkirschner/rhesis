'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { TextField } from '@mui/material';
import type {
    GridColDef,
    GridRowSelectionModel,
    GridRenderCellParams,
} from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import InlineLoader from '../InlineLoader';
import ErrorBanner from '../ErrorBanner';
import type { UiCreateTestFormData, UiTestRow } from '../types';

type PaginationChange = { page: number; pageSize: number };

type Props = {
    readonly rows: readonly UiTestRow[];
    readonly totalCount: number;
    readonly loading?: boolean;
    readonly error?: string;
    readonly page: number;
    readonly pageSize: number;
    readonly onPaginationChange: (next: PaginationChange) => void;
    readonly onFilterODataChange: (odata: string | null) => void;
    readonly selectedIds: readonly string[];
    readonly onSelectedIdsChange: (ids: readonly string[]) => void;
    readonly onRowClick: (id: string) => void;
    readonly onDeleteSelected: () => void;
    readonly onAssociateSelected: (testSetId: string) => void;
    readonly onCreateTest: (data: UiCreateTestFormData) => void | Promise<void>;
    readonly onGenerateTests: () => void;
    readonly onWriteMultiple: () => void;
};

export default function StepTestsTable(props: Props) {
    const {
        rows,
        totalCount,
        loading,
        error,
        page,
        pageSize,
        onPaginationChange,
        onFilterODataChange,
        selectedIds,
        onSelectedIdsChange,
        onRowClick,
    } = props;

    const columns = useMemo<readonly GridColDef<UiTestRow>[]>(() => {
        return [
            { field: 'content', headerName: 'Prompt', flex: 2 },
            { field: 'behaviorName', headerName: 'Behavior', flex: 1 },
            { field: 'topicName', headerName: 'Topic', flex: 1 },
            { field: 'categoryName', headerName: 'Category', flex: 1 },
            {
                field: 'assigneeDisplay',
                headerName: 'Assignee',
                flex: 1,
                renderCell: (p: GridRenderCellParams<UiTestRow, string>) => p.value ?? '',
            },
            { field: 'comments', headerName: 'Comments', type: 'number', flex: 0.6 },
            { field: 'tasks', headerName: 'Tasks', type: 'number', flex: 0.6 },
        ] as const;
    }, []);

    if (loading && rows.length === 0) {
        return <InlineLoader />;
    }
    if (error) {
        return <ErrorBanner message={error} />;
    }

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
                    size="small"
                    fullWidth
                    label="OData filter"
                    placeholder="e.g. contains(topicName,'foo') and priority gt 1"
                    onChange={(e) => onFilterODataChange(e.target.value || null)}
                />
            </Box>
            <BaseDataGrid<UiTestRow>
                rows={rows}
                columns={columns}
                paginationMode="server"
                paginationModel={{ page, pageSize }}
                rowCount={totalCount}
                onPaginationModelChange={(m) => onPaginationChange({ page: m.page, pageSize: m.pageSize })}
                checkboxSelection
                rowSelectionModel={selectedIds as string[]}
                onRowSelectionModelChange={(m: GridRowSelectionModel) =>
                    onSelectedIdsChange(m.map(String))
                }
                getRowId={(r) => r.id}
                onRowClick={(params) => onRowClick(String(params.id))}
                disableRowSelectionOnClick
            />
        </Box>
    );
}
