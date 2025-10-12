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
  TestSet,
  Project,
  Endpoint,
  TestRunDetail,
  TestConfigurationCreate,
} from '@/api-client/types.gen';

import {
  // queries
  readUsersUsersGetOptions,
  readTestSetsTestSetsGetOptions,
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  // mutations
  createTestConfigurationTestConfigurationsPostMutation,
  executeTestConfigurationEndpointTestConfigurationsTestConfigurationIdExecutePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type TestRunDrawerProps = {
  open: boolean;
  onCloseAction: () => void;
  sessionToken: string;
  testRun?: TestRunDetail;
  onSuccessAction?: () => void;
};

function safeBase64UrlDecode(base64url: string) {
  try {
    const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return atob(b64 + pad);
  } catch {
    return '';
  }
}

function getCurrentUserIdFromJWT(sessionToken?: string) {
  if (!sessionToken) return undefined;
  try {
    const [, mid] = sessionToken.split('.');
    if (!mid) return undefined;
    const json = safeBase64UrlDecode(mid);
    return json ? (JSON.parse(json)?.user?.id as string | undefined) : undefined;
  } catch {
    return undefined;
  }
}

/** Narrow to objects */
function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Narrow to shapes like `{ data: T[] }` (data may be readonly) */
function hasDataArray<T>(value: unknown): value is { data: ReadonlyArray<T> } {
  return isObject(value) && Array.isArray((value as { data?: unknown }).data);
}

/**
 * Normalize SDK responses that might be `T[]` or `{ data: T[] }`.
 * Returns a new mutable array (never the original reference).
 */
export function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    // Copy to ensure we always return a fresh, mutable array
    return payload.slice() as T[];
  }
  if (hasDataArray<T>(payload)) {
    return Array.from(payload.data);
  }
  return [];
}

export default function TestRunDrawer({
                                        open,
                                        onCloseAction,
                                        sessionToken,
                                        testRun,
                                        onSuccessAction,
                                      }: TestRunDrawerProps) {
  const notifications = useNotifications();

  const [error, setError] = React.useState<string>();
  const [assignee, setAssignee] = React.useState<User | null>(null);
  const [owner, setOwner] = React.useState<User | null>(null);
  const [testSet, setTestSet] = React.useState<TestSet | null>(null);
  const [project, setProject] = React.useState<Project | null>(null);
  const [endpoint, setEndpoint] = React.useState<Endpoint | null>(null);

  const currentUserId = React.useMemo(
      () => getCurrentUserIdFromJWT(sessionToken),
      [sessionToken],
  );

  const common = React.useMemo(
      () => ({
        headers: { Authorization: `Bearer ${sessionToken}` },
        baseUrl: process.env.BACKEND_URL,
      }),
      [sessionToken],
  );

  /* ---------------- Queries (fetch only when drawer open) ---------------- */
  const [usersQuery, testSetsQuery, projectsQuery, endpointsQuery] = useQueries({
    queries: [
      {
        ...readUsersUsersGetOptions({ ...common }),
        enabled: open && !!sessionToken,
        staleTime: 60_000,
      },
      {
        ...readTestSetsTestSetsGetOptions({ ...common, query: { limit: 100 } }),
        enabled: open && !!sessionToken,
        staleTime: 60_000,
      },
      {
        ...readProjectsProjectsGetOptions({ ...common }),
        enabled: open && !!sessionToken,
        staleTime: 60_000,
      },
      {
        ...readEndpointsEndpointsGetOptions({ ...common }),
        enabled: open && !!sessionToken,
        staleTime: 60_000,
      },
    ],
  });

  const users = asArray<User>(usersQuery.data);
  const testSets = asArray<TestSet>(testSetsQuery.data);
  const projects = asArray<Project>(projectsQuery.data);
  const endpoints = asArray<Endpoint>(endpointsQuery.data);

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
    return endpoints.filter((e) => e.project_id === project.id);
  }, [endpoints, project]);

  /* ---------------- Initialize selections when data arrives ---------------- */
  React.useEffect(() => {
    if (!open) return;

    if (testRun && users.length) {
      if (testRun.assignee_id) {
        setAssignee(users.find((u) => u.id === testRun.assignee_id) ?? null);
      }
      if (testRun.owner_id) {
        setOwner(users.find((u) => u.id === testRun.owner_id) ?? null);
      }
    }

    if (!testRun && users.length && currentUserId && !owner) {
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
        ...common,
        body: createBody,
      }));

      const createdId: string | undefined = created.id ;

      if (!createdId) {
        setError('Failed to create test configuration (missing id).');
        return;
      }

      // Execute configuration
      await executeConfigMutation.mutateAsync({
        ...common,
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
              <Autocomplete<User, false, false, false>
                  options={users}
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
                  options={users}
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
              <Autocomplete<TestSet, false, false, false>
                  options={testSets}
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
              <Autocomplete<Project, false, false, false>
                  options={projects}
                  value={project}
                  onChange={(_, v) => setProject(v)}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        {option.name}
                      </Box>
                  )}
                  renderInput={(params) => <TextField {...params} label="Application" required />}
              />

              {/* Endpoint (filtered by project) */}
              <Autocomplete<Endpoint, false, false, false>
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
