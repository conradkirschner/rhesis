'use client';

import { useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { useTokensData } from '@/hooks/data/Tokens/useTokensData';

export default function TokensContainer() {
    // Use the hook's *actual* row type to avoid name collisions (TS2719)
    const { rows, total, isLoading } = useTokensData();
    type Row = (typeof rows)[number];

    const columns: readonly GridColDef<Row>[] = useMemo(
        () =>
            [
                { field: 'title', headerName: 'Name', flex: 1 },
                { field: 'last4', headerName: 'Last 4', flex: 0.5 },
                { field: 'created_at', headerName: 'Created', flex: 1 },
            ] as const,
        [],
    );

    return (
        <BaseDataGrid<Row>
            rows={rows}
            columns={columns}
            paginationMode="client"
            rowCount={total}
            loading={isLoading}
            sx={{ minHeight: 360 }}
        />
    );
}
