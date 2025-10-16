'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
import ActionBar from './ActionBar';
import ErrorBanner from './ErrorBanner';
import type { UiEnvironment, UiProjectOption, UiSwaggerEndpointFormProps } from './types';

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

function ProjectIcon({ project }: { project?: UiProjectOption }) {
  if (project?.icon && ICON_MAP[project.icon]) {
    const C = ICON_MAP[project.icon];
    return <C />;
  }
  return <SmartToyIcon />;
}

const ENVIRONMENTS: readonly UiEnvironment[] = ['production', 'staging', 'development'] as const;

export default function SwaggerEndpointForm(props: UiSwaggerEndpointFormProps) {
  const {
    name,
    description,
    environment,
    swaggerUrl,
    projectId,
    projects,
    loadingProjects,
    projectsErrorMessage,
    errorMessage,
    isImporting,
    disableCreate,
    onChange,
    onImportClick,
    onSubmit,
    onCancel,
  } = props;

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Card>
        <ActionBar onCancel={onCancel} onSubmit={onSubmit} disableCreate={disableCreate} />

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                General Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={name}
                    onChange={(e) => onChange('name', e.target.value)}
                    required
                    inputProps={{ 'data-test-id': 'name-input' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={description}
                    onChange={(e) => onChange('description', e.target.value)}
                    multiline
                    rows={1}
                    inputProps={{ 'data-test-id': 'description-input' }}
                  />
                </Grid>
              </Grid>
            </Grid>

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
                      onChange={(e) => onChange('swaggerUrl', e.target.value)}
                      placeholder="https://api.example.com/openapi.json"
                      inputProps={{ 'data-test-id': 'openapi-url-input' }}
                    />
                    <LoadingButton
                      variant="outlined"
                      onClick={onImportClick}
                      loading={isImporting}
                      loadingPosition="start"
                      startIcon={<DownloadIcon />}
                      sx={{ minWidth: 200 }}
                      data-test-id="import-openapi-button"
                    >
                      Import
                    </LoadingButton>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Project
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {projectsErrorMessage ? (
                    <Alert severity="error">{projectsErrorMessage}</Alert>
                  ) : projects.length === 0 && !loadingProjects ? (
                    <Alert severity="warning">
                      No projects available. Please create a project first.
                    </Alert>
                  ) : (
                    <FormControl fullWidth required error={!projectId}>
                      <InputLabel id="project-select-label">Select Project</InputLabel>
                      <Select
                        labelId="project-select-label"
                        id="project-select"
                        value={projectId}
                        onChange={(e) => onChange('projectId', String(e.target.value))}
                        label="Select Project"
                        disabled={loadingProjects}
                        required
                        renderValue={(selected) => {
                          const p = projects.find((x) => x.id === selected);
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                <ProjectIcon project={p} />
                              </Box>
                              {p?.name ?? 'No project selected'}
                            </Box>
                          );
                        }}
                        inputProps={{ 'data-test-id': 'project-select' }}
                      >
                        {loadingProjects ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading projects...
                          </MenuItem>
                        ) : (
                          projects.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              <ListItemIcon>
                                <ProjectIcon project={p} />
                              </ListItemIcon>
                              <ListItemText primary={p.name} secondary={p.description} />
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {!projectId && (
                        <FormHelperText error>A project is required</FormHelperText>
                      )}
                    </FormControl>
                  )}
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Environment
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ToggleButtonGroup
                    value={environment}
                    exclusive
                    onChange={(_, value: UiEnvironment | null) => {
                      if (value) onChange('environment', value);
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
                    {ENVIRONMENTS.map((env) => (
                      <ToggleButton
                        key={env}
                        value={env}
                        data-test-id={`env-${env}`}
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

      {(errorMessage || projectsErrorMessage) && (
        <Box sx={{ mt: 2 }}>
          <ErrorBanner message={errorMessage ?? 'Failed to load projects. Please try again later.'} />
        </Box>
      )}
    </form>
  );
}