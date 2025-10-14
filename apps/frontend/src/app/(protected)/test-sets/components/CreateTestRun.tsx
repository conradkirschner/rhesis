'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Stack,
  Autocomplete,
  TextField,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import {keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import type {
  EndpointEnvironment,
  TestSetExecutionRequest, ProjectDetail, EndpointDetail,
} from '@/api-client/types.gen';

import {
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type Id = string;

interface CreateTestRunProps {
  open: boolean;
  selectedTestSetIds: string[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  submitRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
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

export default function CreateTestRun({
                                        open,
                                        selectedTestSetIds,
                                        onSuccess,
                                        onError,
                                        submitRef,
                                      }: CreateTestRunProps) {
  const [selectedProject, setSelectedProject] = useState<Id | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Id | null>(null);
  const [executionMode, setExecutionMode] =
      useState<TestSetExecutionRequest['execution_mode']>('Parallel');

  const projectsQuery = useQuery({
    ...readProjectsProjectsGetOptions(
        { query: {sort_by: 'name', sort_order: 'asc', limit: 100 }},
    ),
    enabled: open,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const endpointsQuery = useQuery({
    ...readEndpointsEndpointsGetOptions(
        {query: { sort_by: 'name', sort_order: 'asc', limit: 100 }},
    ),
    enabled: open,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const executeMutation = useMutation({
    ...executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation(
    ),
  });

  const projects: ProjectDetail[] = projectsQuery.data?.data ??[]

  const endpoints: EndpointDetail[] = endpointsQuery.data?.data ?? []

  // Move the filter function to a query (maybe tanstack query)
  const filteredEndpoints = useMemo(() => {
    if (!selectedProject) return [];
    return endpoints.filter(ep => (ep.project_id ?? null) === selectedProject);
  }, [selectedProject, endpoints]);

  // Reset selections when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedProject(null);
      setSelectedEndpoint(null);
    }
  }, [open]);

  const handleEndpointChange = useCallback((value: EndpointDetail | null) => {
    setSelectedEndpoint(value ? value.id : null);
  }, []);

  // Submit handler wired to parent via ref
  const handleSubmit = useCallback(async () => {
    if (!selectedEndpoint || selectedTestSetIds.length === 0) {
      onError?.('Please select an endpoint');
      return;
    }

    try {
      const body: TestSetExecutionRequest = {
        execution_mode: executionMode,
      };

      await Promise.all(
          selectedTestSetIds.map(id =>
              executeMutation.mutateAsync({
                path: { test_set_identifier: id, endpoint_id: selectedEndpoint },
                body,
              }),
          ),
      );

      onSuccess?.();
    } catch (e) {
      onError?.('Failed to execute test sets');
    }
  }, [
    executeMutation,
    executionMode,
    onError,
    onSuccess,
    selectedEndpoint,
    selectedTestSetIds,
  ]);

  useEffect(() => {
    if (submitRef) submitRef.current = handleSubmit;
  }, [submitRef, handleSubmit]);

  const loading =
      projectsQuery.isFetching || endpointsQuery.isFetching || executeMutation.isPending;

  return (
      <>
        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
        ) : (
            <Stack spacing={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Execution Target
              </Typography>

              <FormControl fullWidth>
                <Autocomplete
                    options={projects.filter(p => !!p.id && !!p.name?.trim())}
                    value={projects.find(p => p.id === selectedProject) ?? null}
                    onChange={(_, newValue) => {
                      if (!newValue) {
                        setSelectedProject(null);
                        setSelectedEndpoint(null);
                        return;
                      }
                      setSelectedProject(newValue.id);
                      setSelectedEndpoint(null);
                    }}
                    getOptionLabel={option => option.name ?? 'Unnamed Project'}
                    renderOption={(props, option) => {
                      return (
                          <Box component="li" {...props} key={option.id}>
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
                {projects.length === 0 && !projectsQuery.isFetching && (
                    <FormHelperText>No projects available</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth>
                <Autocomplete
                    options={filteredEndpoints.filter(e => !!e.id && !!e.name?.trim())}
                    value={filteredEndpoints.find(e => e.id === selectedEndpoint) ?? null}
                    onChange={(_, newValue) => handleEndpointChange(newValue)}
                    getOptionLabel={option => option.name ?? 'Unnamed Endpoint'}
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
                            (e.target.value as TestSetExecutionRequest['execution_mode']) ?? 'Parallel',
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
      </>
  );
}
