'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import BaseDrawer from '@/components/common/BaseDrawer';
import {
  Box,
  Typography,
  FormControl,
  FormHelperText,
  Paper,
  Chip,
  Autocomplete,
  TextField,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  readTestTestsTestIdGetOptions,
  readPromptPromptsPromptIdGetOptions,
  invokeEndpointEndpointsEndpointIdInvokePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type ProjectOption = { id: string; name: string };
type EndpointOption = {
  id: string;
  name: string;
  environment?: 'development' | 'staging' | 'production';
  project_id?: string | null;
};

interface TrialDrawerProps {
  open: boolean;
  onClose: () => void;
  testIds: string[];
  onSuccess?: () => void;
}

export default function TrialDrawer({
                                      open,
                                      onClose,
                                      testIds,
                                      onSuccess,
                                    }: TrialDrawerProps) {
  const theme = useTheme();
  const [error, setError] = useState<string>();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [trialResponse, setTrialResponse] =
      useState<{ output?: string } | null>(null);

  /** Reset transient state when the drawer opens */
  useEffect(() => {
    if (open) {
      setError(undefined);
      setTrialResponse(null);
    }
  }, [open]);

  /** Load projects (sorted by name asc) */
  const projectsQuery = useQuery({
    ...readProjectsProjectsGetOptions({
      query: { sort_by: 'name', sort_order: 'asc', limit: 100 },
    }),
    enabled: open,
  });

  /** Load endpoints (sorted by name asc) */
  const endpointsQuery = useQuery({
    ...readEndpointsEndpointsGetOptions({
      query: { sort_by: 'name', sort_order: 'asc', limit: 100 },
    }),
    enabled: open,
  });

  /** Load test (we only support single-test run here) */
  const testId = testIds[0];
  const testQuery = useQuery({
    ...readTestTestsTestIdGetOptions({ path: { test_id: String(testId ?? '') } }),
    enabled: open && Boolean(testId),
  });

  /** If test has a prompt_id but no prompt object, fetch the prompt */
  const promptId = testQuery.data?.prompt_id ?? null;
  const shouldFetchPrompt =
      open && Boolean(testId) && Boolean(promptId) && !testQuery.data?.prompt;

  const promptQuery = useQuery({
    ...readPromptPromptsPromptIdGetOptions({
      path: { prompt_id: String(promptId ?? '') },
    }),
    enabled: Boolean(shouldFetchPrompt),
  });

  /** Normalize options for Autocomplete (projects/endpoints) */
  const projects: ProjectOption[] = useMemo(
      () =>
          (projectsQuery.data?.data ?? [])
              .map(p => ({ id: p.id ?? '', name: (p.name ?? '').trim() }))
              .filter(p => p.id && p.name),
      [projectsQuery.data],
  );

  const endpoints: EndpointOption[] = useMemo(
      () =>
          (endpointsQuery.data?.data ?? [])
              .map(e => ({
                id: e.id ?? '',
                name: (e.name ?? '').trim(),
                environment: e.environment as EndpointOption['environment'] | undefined,
                project_id: e.project_id ?? null,
              }))
              .filter(e => e.id && e.name),
      [endpointsQuery.data],
  );

  /** Endpoints filtered by selected project */
  const filteredEndpoints = useMemo(
      () =>
          selectedProject
              ? endpoints.filter(e => e.project_id === selectedProject)
              : [],
      [endpoints, selectedProject],
  );

  /** When project changes, clear endpoint selection */
  useEffect(() => {
    setSelectedEndpoint(null);
  }, [selectedProject]);

  /** Resolve prompt content (use embedded prompt, else fetched prompt) */
  const promptContent = testQuery.data?.prompt?.content

  /** Invoke endpoint mutation */
  const invokeMutation = useMutation({
    ...invokeEndpointEndpointsEndpointIdInvokePostMutation(),
    onError: (err: unknown) => {
      const msg =
          err instanceof Error ? err.message : 'Failed to execute trial';
      setError(msg);
    },
  });

  const loading =
      projectsQuery.isFetching ||
      endpointsQuery.isFetching ||
      testQuery.isFetching ||
      promptQuery.isFetching ||
      invokeMutation.isPending;

  const handleEndpointChange = (value: EndpointOption | null) => {
    setSelectedEndpoint(value ? value.id : null);
  };

  const handleSave = useCallback(async () => {
    setError(undefined);
    setTrialResponse(null);

    if (!selectedEndpoint) {
      setError('Please select an endpoint.');
      return;
    }
    if (!promptContent || !promptContent.trim()) {
      setError('Test prompt content is empty.');
      return;
    }

    const response = await invokeMutation.mutateAsync({
      path: { endpoint_id: selectedEndpoint },
      body: { input: promptContent },
    });

    // Most backends return { output: string, ... }. Keep minimal typing here.
    setTrialResponse(response as { output?: string });
    onSuccess?.();
  }, [invokeMutation, selectedEndpoint, promptContent, onSuccess]);

  return (
      <BaseDrawer
          open={open}
          onClose={onClose}
          title="Run Test"
          loading={loading}
          error={error}
          onSave={handleSave}
          saveButtonText={invokeMutation.isPending ? 'Running Test...' : 'Run Test'}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Project */}
          <FormControl fullWidth>
            <Autocomplete<ProjectOption>
                options={projects}
                value={
                    projects.find(p => p.id === selectedProject) ?? null
                }
                onChange={(_, newValue) =>
                    setSelectedProject(newValue ? newValue.id : null)
                }
                getOptionLabel={o => o.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderOption={(props, option) => {
                  const { key, ...other } = props;
                  return (
                      <Box component="li" key={option.id} {...other}>
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
            />
            {projects.length === 0 && !projectsQuery.isFetching && (
                <FormHelperText>No projects available</FormHelperText>
            )}
          </FormControl>

          {/* Endpoint */}
          <FormControl fullWidth>
            <Autocomplete<EndpointOption>
                options={filteredEndpoints}
                value={
                    filteredEndpoints.find(e => e.id === selectedEndpoint) ?? null
                }
                onChange={(_, newValue) => handleEndpointChange(newValue)}
                getOptionLabel={o => o.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                disabled={!selectedProject}
                renderOption={(props, option) => {
                  const { key, ...other } = props;
                  return (
                      <Box
                          key={option.id}
                          component="li"
                          {...other}
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
                                color={
                                  option.environment === 'production'
                                      ? 'error'
                                      : option.environment === 'staging'
                                          ? 'warning'
                                          : 'success'
                                }
                                sx={{ ml: 1 }}
                            />
                        )}
                      </Box>
                  );
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        label="Endpoint"
                        required
                        placeholder={
                          selectedProject ? 'Select endpoint' : 'Select a project first'
                        }
                    />
                )}
            />
            {selectedProject &&
                filteredEndpoints.length === 0 &&
                !endpointsQuery.isFetching && (
                    <FormHelperText>
                      No endpoints available for this project
                    </FormHelperText>
                )}
          </FormControl>

          {/* Test Executable */}
          {!!promptContent && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Test Executable
                </Typography>
                <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: theme.shape.borderRadius,
                      minHeight: '100px',
                    }}
                >
                  {promptContent}
                </Typography>
              </Paper>
          )}

          {/* Response Output */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Response Output
            </Typography>
            <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  p: 1,
                  bgcolor: 'action.hover',
                  borderRadius: theme.shape.borderRadius,
                  minHeight: '100px',
                }}
            >
              {trialResponse?.output ?? 'Run the trial to see the response'}
            </Typography>
          </Paper>
        </Box>
      </BaseDrawer>
  );
}
