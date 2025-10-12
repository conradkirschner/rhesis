'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  Chip,
  Stack,
  Autocomplete,
  TextField,
  FormControl,
  FormHelperText,
  Divider,
  Typography,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  CallSplit as CallSplitIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import BaseDrawer from '@/components/common/BaseDrawer';
import { useNotifications } from '@/components/common/NotificationContext';

import type {
  Project,
  Endpoint,
  EndpointEnvironment,
  TestSetExecutionRequest,
} from '@/api-client/types.gen';

import {
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type Id = string;

interface ExecuteTestSetDrawerProps {
  open: boolean;
  onClose: () => void;
  testSetId: Id;
  sessionToken: string;
}

function envChipColor(env?: EndpointEnvironment) {
  switch (env) {
    case 'production':
      return 'error';
    case 'staging':
      return 'warning';
    case 'development':
      return 'success';
    default:
      return 'default';
  }
}

export default function ExecuteTestSetDrawer({
                                               open,
                                               onClose,
                                               testSetId,
                                               sessionToken,
                                             }: ExecuteTestSetDrawerProps) {
  const [selectedProject, setSelectedProject] = useState<Id | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Id | null>(null);
  const [executionMode, setExecutionMode] =
      useState<TestSetExecutionRequest['execution_options']>('Parallel');

  const notifications = useNotifications();

  const projectsQuery = useQuery({
    ...readProjectsProjectsGetOptions(
        { query:{ sort_by: 'name', sort_order: 'asc', limit: 100 }},
    ),
    enabled: open && Boolean(sessionToken),
  });

  const endpointsQuery = useQuery({
    ...readEndpointsEndpointsGetOptions(
        { query:{ sort_by: 'name', sort_order: 'asc', limit: 100 }},
    ),
    enabled: open && Boolean(sessionToken),
  });

  const executeMutation = useMutation({
    ...executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation(),
    onSuccess: () => {
      notifications.show('Test set execution started successfully!', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      onClose();
    },
  });

  // Reset selections whenever drawer opens
  useEffect(() => {
    if (open) {
      setSelectedProject(null);
      setSelectedEndpoint(null);
    }
  }, [open]);

  // Extract arrays regardless of whether the API returns `T[]` or `{ data: T[] }`
  const projectsList: Project[] = useMemo(() => {
    const raw = projectsQuery.data as Project[] | { data?: Project[] } | undefined;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [];
  }, [projectsQuery.data]);

  const endpointsList: Endpoint[] = useMemo(() => {
    const raw = endpointsQuery.data as Endpoint[] | { data?: Endpoint[] } | undefined;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [];
  }, [endpointsQuery.data]);

  // Filter endpoints by selected project
  const filteredEndpoints = useMemo(() => {
    if (!selectedProject) return [];
    return endpointsList.filter(ep => (ep.project_id ?? null) === selectedProject);
  }, [selectedProject, endpointsList]);

  const loading = projectsQuery.isFetching || endpointsQuery.isFetching || executeMutation.isPending;

  const errorMsg =
      (projectsQuery.error as Error | undefined)?.message ??
      (endpointsQuery.error as Error | undefined)?.message ??
      (executeMutation.error as Error | undefined)?.message ??
      undefined;

  const isFormValid = Boolean(selectedProject && selectedEndpoint);

  const handleExecute = () => {
    if (!selectedEndpoint) return;

    // Variables shape matches the generated mutation
    executeMutation.mutate({
      path: { test_set_identifier: testSetId, endpoint_id: selectedEndpoint },
      body: { execution_options: executionMode },
    });
  };

  return (
      <BaseDrawer
          open={open}
          onClose={onClose}
          title="Execute Test Set"
          loading={loading}
          error={errorMsg}
          onSave={isFormValid ? handleExecute : undefined}
          saveButtonText="Execute Test Set"
      >
        {loading && !projectsList.length && !filteredEndpoints.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
        ) : (
            <Stack spacing={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Execution Target
              </Typography>

              <FormControl fullWidth>
                <Autocomplete<Project, false, false, false>
                    options={projectsList.filter(p => Boolean(p.id) && Boolean(p.name?.trim()))}
                    value={projectsList.find(p => p.id === selectedProject) ?? null}
                    onChange={(_, newValue) => {
                      if (!newValue) {
                        setSelectedProject(null);
                        setSelectedEndpoint(null);
                        return;
                      }
                      setSelectedProject(newValue.id);
                      setSelectedEndpoint(null);
                    }}
                    getOptionLabel={option => option.name}
                    renderOption={(props, option) => {
                      return (
                          <Box component="li"  {...props} key={option.id}>
                            {option.name}
                          </Box>
                      );
                    }}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label="Project"
                            required
                            placeholder="Select a project"
                        />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={projectsQuery.isFetching}
                />
                {projectsList.length === 0 && !projectsQuery.isFetching && (
                    <FormHelperText>No projects available</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth>
                <Autocomplete<Endpoint, false, false, false>
                    options={filteredEndpoints.filter(e => Boolean(e.id) && Boolean(e.name?.trim()))}
                    value={filteredEndpoints.find(e => e.id === selectedEndpoint) ?? null}
                    onChange={(_, newValue) => setSelectedEndpoint(newValue ? newValue.id : null)}
                    getOptionLabel={option => option.name}
                    disabled={!selectedProject}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label="Endpoint"
                            required
                            placeholder={selectedProject ? 'Select endpoint' : 'Select a project first'}
                        />
                    )}
                    renderOption={(props, option) => {
                      return (
                          <Box
                              {...props}
                              key={option.id}
                              component="li"
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                          >
                            <span>{option.name}</span>
                            {option.environment && (
                                <Chip
                                    label={option.environment}
                                    size="small"
                                    color={envChipColor(option.environment)}
                                    sx={{ ml: 1 }}
                                />
                            )}
                          </Box>
                      );
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={endpointsQuery.isFetching}
                />
                {filteredEndpoints.length === 0 && selectedProject && !endpointsQuery.isFetching && (
                    <FormHelperText>No endpoints available for this project</FormHelperText>
                )}
              </FormControl>

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">
                Configuration Options
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Execution Mode</InputLabel>
                <Select
                    value={executionMode ?? 'Parallel'}
                    onChange={e =>
                        setExecutionMode(
                            (e.target.value as TestSetExecutionRequest['execution_options']) ?? 'Parallel',
                        )
                    }
                    label="Execution Mode"
                >
                  <MenuItem value="Parallel">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CallSplitIcon fontSize="small" />
                      <Box>
                        <Typography variant="body1">Parallel</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tests run simultaneously for faster execution (default)
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Sequential">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ArrowForwardIcon fontSize="small" />
                      <Box>
                        <Typography variant="body1">Sequential</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tests run one after another, better for rate-limited endpoints
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
        )}
      </BaseDrawer>
  );
}
