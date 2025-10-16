'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { Box, Chip, Paper, Typography, useTheme } from '@mui/material';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import {
  Add as AddIcon,
} from '@mui/icons-material';
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
import { GridColDef } from '@mui/x-data-grid';
import { SmartToy as SmartToyIcon, Devices as DevicesIcon, Web as WebIcon, Storage as StorageIcon, Code as CodeIcon } from '@mui/icons-material';
import type { UiEndpointRow, UiPaginationModel, UiProjectIconName } from '../types';

const ICON_MAP: Record<UiProjectIconName, React.ComponentType> = {
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

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'project',
        headerName: 'Project',
        flex: 1.2,
        sortable: false,
        renderCell: (params) => {
          const { projectLabel, projectIconName } = params.row as UiEndpointRow;
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
        renderCell: (params) => <Chip label={params.value as string} size="small" variant="outlined" />,
      },
      {
        field: 'environment',
        headerName: 'Environment',
        flex: 0.8,
        renderCell: (params) => <Chip label={params.value as string} size="small" variant="outlined" />,
      },
    ],
    [theme],
  );

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <BaseDataGrid
        rows={rows as readonly any[]}
        columns={columns}
        loading={loading}
        density="comfortable"
        customToolbarContent={null}
        linkPath="/endpoints"
        linkField="id"
        serverSidePagination
        totalRows={totalCount}
        paginationModel={paginationModel as any}
        onPaginationModelChange={(m: any) => onPaginationModelChange(m)}
        pageSizeOptions={[10, 25, 50]}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectedRowIds as any}
        onRowSelectionModelChange={(m: any) => onSelectionChange(m)}
        disablePaperWrapper
        componentsProps={{
          toolbar: { 'data-test-id': 'endpoints-toolbar', startIcon: <AddIcon /> },
        }}
      />
    </Paper>
  );
}