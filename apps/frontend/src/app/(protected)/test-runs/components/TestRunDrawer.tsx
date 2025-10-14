'use client';

import React from 'react';
import BaseDrawer from '@/components/common/BaseDrawer';
import {
  Autocomplete,
  TextField,
  Box,
  Avatar,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useNotifications } from '@/components/common/NotificationContext';
import { useMutation, useQueries } from '@tanstack/react-query';

import type {
  User,
  TestRunDetail,
  TestConfigurationCreate, TestSetDetail, EndpointDetail, ProjectDetail,
} from '@/api-client/types.gen';

import {
  readUsersUsersGetOptions,
  readTestSetsTestSetsGetOptions,
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  createTestConfigurationTestConfigurationsPostMutation,
  executeTestConfigurationEndpointTestConfigurationsTestConfigurationIdExecutePostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import {useSession} from "next-auth/react";

type TestRunDrawerProps = {
  open: boolean;
  onCloseAction: () => void;
  testRun?: TestRunDetail;
  onSuccessAction?: () => void;
};

export default function TestRunDrawer({
                                        open,
                                        onCloseAction,
                                        testRun,
                                        onSuccessAction,
                                      }: TestRunDrawerProps) {
  const notifications = useNotifications();
  const session = useSession();

  const [error, setError] = React.useState<string>();
  const [assignee, setAssignee] = React.useState<User | null>(null);
  const [owner, setOwner] = React.useState<User | null>(null);
  const [testSet, setTestSet] = React.useState<TestSetDetail | null>(null);
  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [endpoint, setEndpoint] = React.useState<EndpointDetail | null>(null);

  const currentUserId = session.data?.user?.id

  const [usersQuery, testSetsQuery, projectsQuery, endpointsQuery] = useQueries({
    queries: [
      {
        ...readUsersUsersGetOptions(),
        enabled: open,
        staleTime: 60_000,
      },
      {
        ...readTestSetsTestSetsGetOptions({ query: { limit: 100 } }),
        enabled: open,
        staleTime: 60_000,
      },
      {
        ...readProjectsProjectsGetOptions(),
        enabled: open,
        staleTime: 60_000,
      },
      {
        ...readEndpointsEndpointsGetOptions(),
        enabled: open,
        staleTime: 60_000,
      },
    ],
  });

  const users = usersQuery.data?.data;
  const testSets =testSetsQuery.data?.data;
  const projects = projectsQuery.data?.data;
  const endpoints = endpointsQuery.data?.data;

  const anyLoading =
      usersQuery.isLoading ||
      testSetsQuery.isLoading ||
      projectsQuery.isLoading ||
      endpointsQuery.isLoading;

  const firstError =
      (usersQuery.error as Error | undefined) ||
      (testSetsQuery.error as Error | undefined) ||
      (projectsQuery.error as Error | undefined) ||
      (endpointsQuery.error as Error | undefined);

  /* ---------------- Derived: endpoints filtered by project ---------------- */
  const filteredEndpoints = React.useMemo(() => {
    if (!project) return [];
    if (!endpoints) return [];
    return endpoints.filter((e) => e.project_id === project.id);
  }, [endpoints, project]);

  React.useEffect(() => {
    if (!open) return;

    if (testRun && users && users.length) {
      if (testRun.assignee_id) {
        setAssignee(users.find((u) => u.id === testRun.assignee_id) ?? null);
      }
      if (testRun.owner_id) {
        setOwner(users.find((u) => u.id === testRun.owner_id) ?? null);
      }
    }

    if (!testRun && users && users.length && currentUserId && !owner) {
      setOwner(users.find((u) => u.id === currentUserId) ?? null);
    }
  }, [open, testRun, users, currentUserId, owner]);

  /* ---------------- Mutations: use generated *Mutation helpers ------------- */
  const createConfigMutation = useMutation({
    ...createTestConfigurationTestConfigurationsPostMutation(),
  });

  const executeConfigMutation = useMutation({
    ...executeTestConfigurationEndpointTestConfigurationsTestConfigurationIdExecutePostMutation(),
  });

  const loading =
      anyLoading || createConfigMutation.isPending || executeConfigMutation.isPending;

  /* ---------------- Handlers ---------------- */
  const getUserDisplayName = (user: User) =>
      user.name ||
      `${user.given_name ?? ''} ${user.family_name ?? ''}`.trim() ||
      user.email ||
      'Unknown';

  const handleSave = async () => {
    setError(undefined);

    if (!testSet || !project || !endpoint || !owner) {
      setError('Please select test set, application, endpoint, and owner.');
      return;
    }

    try {
      // Create configuration
      const createBody: TestConfigurationCreate = {
        endpoint_id: endpoint.id,
        test_set_id: testSet.id,
        user_id: owner.id,
        organization_id: endpoint.organization_id ?? project.organization_id,
      };

      const created = (await createConfigMutation.mutateAsync({
        body: createBody,
      }));

      const createdId = created.id ;

      if (!createdId) {
        setError('Failed to create test configuration (missing id).');
        return;
      }

      // Execute configuration
      await executeConfigMutation.mutateAsync({
        path: { test_configuration_id: createdId },
      });

      notifications.show('Test execution started successfully', {
        severity: 'success',
      });

      onSuccessAction?.();
      onCloseAction();
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Failed to execute test run';
      setError(msg);
    }
  };

  return (
      <BaseDrawer
          open={open}
          onClose={onCloseAction}
          title="Test Run Configuration"
          loading={loading}
          error={firstError?.message ?? error}
          onSave={handleSave}
          saveButtonText="Execute Now"
      >
        <Stack spacing={3}>
          {/* Workflow */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Workflow
            </Typography>

            <Stack spacing={2}>
              {/* Assignee */}
              <Autocomplete
                  options={users??[]}
                  value={assignee}
                  onChange={(_, v) => setAssignee(v)}
                  getOptionLabel={getUserDisplayName}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={option.picture ?? undefined} sx={{ width: 24, height: 24 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          {getUserDisplayName(option)}
                        </Box>
                      </Box>
                  )}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          label="Assignee"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: assignee && (
                                <Avatar src={assignee.picture ?? undefined} sx={{ width: 24, height: 24, mr: 1 }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                            ),
                          }}
                      />
                  )}
              />

              {/* Owner */}
              <Autocomplete<User, false, false, false>
                  options={users??[]}
                  value={owner}
                  onChange={(_, v) => setOwner(v)}
                  getOptionLabel={getUserDisplayName}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={option.picture ?? undefined} sx={{ width: 24, height: 24 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          {getUserDisplayName(option)}
                        </Box>
                      </Box>
                  )}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          label="Owner"
                          required
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: owner && (
                                <Avatar src={owner.picture ?? undefined} sx={{ width: 24, height: 24, mr: 1 }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                            ),
                          }}
                      />
                  )}
              />
            </Stack>
          </Stack>

          <Divider />

          {/* Test Run Configuration */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Test Run Configuration
            </Typography>

            <Stack spacing={2}>
              {/* Test Set */}
              <Autocomplete
                  options={testSets??[]}
                  value={testSet}
                  onChange={(_, v) => setTestSet(v)}
                  getOptionLabel={(o) => o.name || 'Unnamed Test Set'}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        {option.name || 'Unnamed Test Set'}
                      </Box>
                  )}
                  renderInput={(params) => <TextField {...params} label="Test Set" required />}
              />

              {/* Application / Project */}
              <Autocomplete
                  options={projects??[]}
                  value={project}
                  onChange={(_, v) => setProject(v)}
                  getOptionLabel={(o) => o.name??'No Projectname'}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        {option.name}
                      </Box>
                  )}
                  renderInput={(params) => <TextField {...params} label="Application" required />}
              />

              {/* Endpoint (filtered by project) */}
              <Autocomplete
                  options={filteredEndpoints}
                  value={endpoint}
                  onChange={(_, v) => setEndpoint(v)}
                  getOptionLabel={(o) => `${o.name} (${o.environment})`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={!project}
                  renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        {option.name} ({option.environment})
                      </Box>
                  )}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          label="Endpoint"
                          required
                          helperText={!project ? 'Select an application first' : undefined}
                      />
                  )}
              />
            </Stack>
          </Stack>
        </Stack>
      </BaseDrawer>
  );
}
