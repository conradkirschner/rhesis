// src/app/(protected)/endpoints/components/ui/StepEndpointsTable.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Box, Chip, Paper, Typography, useTheme, Button } from '@mui/material';
import BaseDataGrid from '@/components/common/BaseDataGrid';

import DataObjectIcon from '@mui/icons-material/DataObject';
import CloudIcon from '@mui/icons-material/Cloud';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TerminalIcon from '@mui/icons-material/Terminal';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import ChatIcon from '@mui/icons-material/Chat';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import {
    Add as AddIcon,
    SmartToy as SmartToyIcon,
    Devices as DevicesIcon,
    Web as WebIcon,
    Storage as StorageIcon,
    Code as CodeIcon,
} from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import type { UiEndpointRow, UiPaginationModel, UiProjectIconName } from '../types';

const ICON_MAP: Record<UiProjectIconName, React.ElementType> = {
    SmartToy: SmartToyIcon,
    Devices: DevicesIcon,
    Web: WebIcon,
    Storage: StorageIcon,
    Code: CodeIcon,
    DataObject: DataObjectIcon,
    Cloud: CloudIcon,
    Analytics: AnalyticsIcon,
    ShoppingCart: ShoppingCartIcon,
    Terminal: TerminalIcon,
    VideogameAsset: VideogameAssetIcon,
    Chat: ChatIcon,
    Psychology: PsychologyIcon,
    Dashboard: DashboardIcon,
    Search: SearchIcon,
    AutoFixHigh: AutoFixHighIcon,
    PhoneIphone: PhoneIphoneIcon,
    School: SchoolIcon,
    Science: ScienceIcon,
    AccountTree: AccountTreeIcon,
};

export interface StepEndpointsTableProps {
    readonly rows: readonly UiEndpointRow[];
    readonly loading: boolean;
    readonly totalCount: number;
    readonly paginationModel: UiPaginationModel;
    onPaginationModelChange(model: UiPaginationModel): void;
    readonly selectedRowIds: readonly string[];
    onSelectionChange(ids: readonly string[]): void;
}

export default function StepEndpointsTable(props: StepEndpointsTableProps) {
    const { rows, loading, totalCount, paginationModel, onPaginationModelChange, selectedRowIds, onSelectionChange } = props;
    const theme = useTheme();

    const columns: GridColDef<UiEndpointRow>[] = React.useMemo(
        () => [
            {
                field: 'project',
                headerName: 'Project',
                flex: 1.2,
                sortable: false,
                renderCell: (params) => {
                    const { projectLabel, projectIconName } = params.row;
                    const Icon = ICON_MAP[projectIconName];
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'primary.main',
                                    '& svg': { fontSize: theme.typography.h5.fontSize },
                                }}
                            >
                                <Icon />
                            </Box>
                            <Typography variant="body2">{projectLabel}</Typography>
                        </Box>
                    );
                },
            },
            { field: 'name', headerName: 'Name', flex: 1 },
            {
                field: 'protocol',
                headerName: 'Protocol',
                flex: 0.7,
                renderCell: (params) => <Chip label={String(params.value)} size="small" variant="outlined" />,
            },
            {
                field: 'environment',
                headerName: 'Environment',
                flex: 0.8,
                renderCell: (params) => <Chip label={String(params.value)} size="small" variant="outlined" />,
            },
        ],
        [theme],
    );

    const customToolbarContent = React.useMemo(
        () => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                    component={Link}
                    href="/endpoints/new"
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    data-test-id="endpoints-toolbar-add"
                >
                    New Endpoint
                </Button>
            </Box>
        ),
        [],
    );

    return (
        <Paper elevation={2} sx={{ p: 2 }}>
            <BaseDataGrid
                rows={[...rows]}
                columns={columns}
                loading={loading}
                density="comfortable"
                customToolbarContent={customToolbarContent}
                linkPath="/endpoints"
                linkField="id"
                serverSidePagination
                rowCount={totalCount}
                paginationModel={paginationModel as any}
                onPaginationModelChange={(m: any) => onPaginationModelChange(m)}
                checkboxSelection
                rowSelectionModel={selectedRowIds as any}
                onRowSelectionModelChange={(m: any) => onSelectionChange(m)}
                disablePaperWrapper
                componentsProps={{
                    toolbar: { 'data-test-id': 'endpoints-toolbar' },
                }}
            />
        </Paper>
    );
}
