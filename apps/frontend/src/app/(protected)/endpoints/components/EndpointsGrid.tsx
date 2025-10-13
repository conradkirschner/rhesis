'use client';

import React, { useMemo, useState } from 'react';
import {
  Chip,
  Paper,
  Box,
  Button,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import {
  GridColDef,
  GridPaginationModel,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import UploadIcon from '@mui/icons-material/UploadOutlined';
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
import { useMutation, useQuery } from '@tanstack/react-query';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import { DeleteModal } from '@/components/common/DeleteModal';
import {
  AddIcon,
  DeleteIcon,
  SmartToyIcon,
  DevicesIcon,
  WebIcon,
  StorageIcon,
  CodeIcon,
} from '@/components/icons';

import type {
  Endpoint,
  ProjectDetail,
} from '@/api-client/types.gen';
import {
  readProjectsProjectsGetOptions,
  deleteEndpointEndpointsEndpointIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

const ICON_MAP: Record<string, React.ComponentType> = {
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

const getProjectIcon = (project?: ProjectDetail) => {
  if (project?.icon && ICON_MAP[project.icon]) {
    const IconComponent = ICON_MAP[project.icon];
    return <IconComponent />;
  }
  return <SmartToyIcon />;
};

interface EndpointGridProps {
  endpoints: Endpoint[];
  loading?: boolean;
  totalCount?: number;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  paginationModel?: GridPaginationModel;
  onEndpointDeleted?: () => void;
}

export default function EndpointGrid({
                                       endpoints,
                                       loading = false,
                                       totalCount = 0,
                                       onPaginationModelChange,
                                       paginationModel = { page: 0, pageSize: 10 },
                                       onEndpointDeleted,
                                     }: EndpointGridProps) {
  const theme = useTheme();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: projectsResponse,
    isLoading: loadingProjects,
  } = useQuery({
    ...readProjectsProjectsGetOptions({
      query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });

  const projectsById = useMemo((): Record<string, ProjectDetail> => {
    const map: Record<string, ProjectDetail> = {};
    const list: ProjectDetail[] =
        projectsResponse?.data ?? [];
    for (const p of list) {
      if (p.id) map[p.id] = p;
    }
    return map;
  }, [projectsResponse]);

  const deleteMutation = useMutation({
    ...deleteEndpointEndpointsEndpointIdDeleteMutation(),
  });

  const handleRowSelectionModelChange = (newSelection: GridRowSelectionModel) => {
    setSelectedRows(newSelection);
  };

  const handleDeleteEndpoints = async () => {
    if (selectedRows.length === 0) return;
    try {
      await Promise.all(
          selectedRows.map((id) =>
              deleteMutation.mutateAsync({ path: { endpoint_id: id as string } })
          )
      );
      setSelectedRows([]);
      setDeleteDialogOpen(false);
      onEndpointDeleted?.();
    } catch {
      // optionally surface a toast/snackbar
    }
  };

  const customToolbar = (
      <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            gap: 2,
          }}
      >
        {selectedRows.length > 0 && (
            <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
            >
              Delete {selectedRows.length} endpoint{selectedRows.length > 1 ? 's' : ''}
            </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
              component={Link}
              href="/endpoints/new"
              variant="outlined"
              startIcon={<AddIcon />}
          >
            New Endpoint
          </Button>
          <Button
              component={Link}
              href="/endpoints/swagger"
              variant="contained"
              startIcon={<UploadIcon />}
          >
            Import Swagger
          </Button>
        </Box>
      </Box>
  );

  const columns: GridColDef[] = [
    {
      field: 'project',
      headerName: 'Project',
      flex: 1.2,
      renderCell: (params) => {
        const endpoint = params.row as Endpoint;
        const project = endpoint.project_id ? projectsById[endpoint.project_id] : undefined;

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
                {getProjectIcon(project)}
              </Box>
              <Typography variant="body2">
                {project ? project.name : 'No project'}
              </Typography>
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
  ];

  return (
      <>
        <Paper elevation={2} sx={{ p: 2 }}>
          <BaseDataGrid
              rows={endpoints}
              columns={columns}
              loading={loading || loadingProjects || deleteMutation.isPending}
              density="comfortable"
              customToolbarContent={customToolbar}
              linkPath="/endpoints"
              linkField="id"
              serverSidePagination
              totalRows={totalCount}
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={handleRowSelectionModelChange}
              disablePaperWrapper
          />
        </Paper>

        <DeleteModal
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDeleteEndpoints}
            isLoading={deleteMutation.isPending}
            title={`Delete Endpoint${selectedRows.length > 1 ? 's' : ''}`}
            message={`Are you sure you want to delete ${selectedRows.length} endpoint${
                selectedRows.length > 1 ? 's' : ''
            }? Don't worry, related data will not be deleted, only ${
                selectedRows.length === 1 ? 'this record' : 'these records'
            }.`}
            itemType="endpoints"
        />
      </>
  );
}
