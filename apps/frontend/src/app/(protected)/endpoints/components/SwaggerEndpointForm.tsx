'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  Grid,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import DownloadIcon from '@mui/icons-material/Download';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DevicesIcon from '@mui/icons-material/Devices';
import WebIcon from '@mui/icons-material/Web';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
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

import { useQuery } from '@tanstack/react-query';
import { createEndpoint } from '@/actions/endpoints';

// Generated API query options + types
import { readProjectsProjectsGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type {Endpoint, PaginatedProjectDetail, ProjectDetail } from '@/api-client/types.gen';

// Map of icon names to components for easy lookup
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

const ENVIRONMENTS = ['production', 'staging', 'development'] as const;
type Environment = (typeof ENVIRONMENTS)[number];

// Get appropriate icon based on project type or use case
const getProjectIcon = (project?: { icon?: string|null }) => {
  if (project?.icon && ICON_MAP[project.icon]) {
    const IconComponent = ICON_MAP[project.icon];
    return <IconComponent />;
  }
  // Fall back to a default icon
  return <SmartToyIcon />;
};

export default function SwaggerEndpointForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [swaggerUrl, setSwaggerUrl] = useState('');

  // Form state for OpenAPI-based creation
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    environment: Environment;
    openapi_spec_url: string;
    config_source: 'openapi';
    project_id: string;
  }>({
    name: '',
    description: '',
    environment: 'development',
    openapi_spec_url: '',
    config_source: 'openapi',
    project_id: '',
  });

  // Load projects via generated TanStack v5 query options (paginated response)
  const {
    data: projectsPage,
    isLoading: loadingProjects,
    isError: projectsError,
  } = useQuery({
    ...readProjectsProjectsGetOptions({
      query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });

  const projects: ProjectDetail[] = useMemo(
      () => ((projectsPage as PaginatedProjectDetail | undefined)?.data ?? []),
      [projectsPage]
  );

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as Environment | 'openapi' | string,
    }));
  };

  const handleImportSpecification = async () => {
    setIsImporting(true);
    setError(null);
    try {
      // Simple client-side store of the URL; add validation if desired
      await new Promise(resolve => setTimeout(resolve, 200));
      setFormData(prev => ({ ...prev, openapi_spec_url: swaggerUrl }));
    } catch (e) {
      setError(
          `Failed to import Swagger specification: ${
              (e as Error).message || 'Unknown error'
          }`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.project_id) {
      setError('Please select a project');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      project_id: formData.project_id,
      environment: formData.environment,
      config_source: 'openapi',
      openapi_spec_url: formData.openapi_spec_url,

      // Minimum required extras to satisfy Omit<Endpoint, 'id'>
      // @todo adjust form
      url: '',
      protocol: 'REST',
      method: 'POST',
      response_format: 'json',
      endpoint_path: '',
    } satisfies Omit<Endpoint, 'id'>;

    try {
      await createEndpoint(payload);
      router.push('/endpoints');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
      <form onSubmit={handleSubmit}>
        <Card>
          {/* Action buttons row */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => router.push('/endpoints')}>
                Cancel
              </Button>
              <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={(projects.length === 0 && !loadingProjects) || isImporting}
              >
                Create Endpoint
              </Button>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* General Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  General Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        multiline
                        rows={1}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Swagger URL */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Swagger / OpenAPI
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                          fullWidth
                          label="OpenAPI JSON URL"
                          value={swaggerUrl}
                          onChange={e => setSwaggerUrl(e.target.value)}
                          placeholder="https://api.example.com/openapi.json"
                      />
                      <LoadingButton
                          variant="outlined"
                          onClick={handleImportSpecification}
                          loading={isImporting}
                          loadingPosition="start"
                          startIcon={<DownloadIcon />}
                          sx={{ minWidth: '200px' }}
                      >
                        Import
                      </LoadingButton>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Project Selection */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Project
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {projectsError && !loadingProjects ? (
                        <Alert severity="error">
                          Failed to load projects. Please try again later.
                        </Alert>
                    ) : projects.length === 0 && !loadingProjects ? (
                        <Alert severity="warning">
                          No projects available. Please create a project first.
                        </Alert>
                    ) : (
                        <FormControl
                            fullWidth
                            required
                            error={Boolean(error && !formData.project_id)}
                        >
                          <InputLabel id="project-select-label">Select Project</InputLabel>
                          <Select
                              labelId="project-select-label"
                              id="project-select"
                              value={formData.project_id}
                              onChange={e => handleChange('project_id', e.target.value)}
                              label="Select Project"
                              disabled={loadingProjects}
                              required
                              renderValue={selected => {
                                const selectedProject = projects.find(p => p.id === selected);
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {selectedProject && (
                                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                            {getProjectIcon(selectedProject)}
                                          </Box>
                                      )}
                                      {selectedProject?.name || 'No project selected'}
                                    </Box>
                                );
                              }}
                          >
                            {loadingProjects ? (
                                <MenuItem disabled>
                                  <CircularProgress size={20} sx={{ mr: 1 }} />
                                  Loading projects...
                                </MenuItem>
                            ) : (
                                projects.map(project => (
                                    <MenuItem key={project.id} value={project.id}>
                                      <ListItemIcon>{getProjectIcon(project)}</ListItemIcon>
                                      <ListItemText
                                          primary={project.name}
                                          secondary={project.description ?? ''}
                                      />
                                    </MenuItem>
                                ))
                            )}
                          </Select>
                          {error && !formData.project_id && (
                              <FormHelperText error>A project is required</FormHelperText>
                          )}
                        </FormControl>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {/* Environment */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Environment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ToggleButtonGroup
                        value={formData.environment}
                        exclusive
                        onChange={(_, newValue: Environment | null) => {
                          if (newValue) {
                            handleChange('environment', newValue);
                          }
                        }}
                        aria-label="environment selection"
                        sx={{
                          '& .MuiToggleButton-root.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'common.white',
                            '&:hover': { backgroundColor: 'primary.dark' },
                          },
                        }}
                    >
                      {ENVIRONMENTS.map(env => (
                          <ToggleButton
                              key={env}
                              value={env}
                              sx={{
                                textTransform: 'capitalize',
                                '&.Mui-selected': { borderColor: 'primary.main' },
                                '&:hover': { backgroundColor: 'action.hover' },
                              }}
                          >
                            {env}
                          </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {(error || projectsError) && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">
                {error ?? 'Failed to load projects. Please try again later.'}
              </Alert>
            </Box>
        )}
      </form>
  );
}
