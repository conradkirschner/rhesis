'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useNotifications } from '@/components/common/NotificationContext';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  readUsersUsersGetOptions,
  readStatusesStatusesGetOptions,
  readTypeLookupsTypeLookupsGetOptions,
  createTaskTasksPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

import type { TaskCreate, Status, User, TypeLookup, EntityType } from '@/api-client/types.gen';


const ALLOWED_STATUS_NAMES = new Set(['Open', 'In Progress', 'Completed', 'Cancelled']);

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { show } = useNotifications();
  const theme = useTheme();

  const [isSaving, setIsSaving] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    status_id: '',
    priority_id: '',
    assignee_id: undefined,
    entity_type: undefined,
    entity_id: undefined,
    task_metadata: undefined,
  });

  // Prefill from URL params
  useEffect(() => {
    const entityType = searchParams.get('entityType') as EntityType | null;
    const entityId = searchParams.get('entityId');
    const commentId = searchParams.get('commentId');

    if (entityType && entityId) {
      setFormData(prev => ({
        ...prev,
        entity_type: entityType,
        entity_id: entityId,
        task_metadata: commentId ? { comment_id: commentId } : undefined,
      }));
    }
  }, [searchParams]);

  // Auth headers for generated hooks
  const headers = useMemo(
      () => (session?.session_token ? { Authorization: `Bearer ${session.session_token}` } : undefined),
      [session?.session_token]
  );

  // Users (assignee dropdown)
  const usersQuery = useQuery({
    ...readUsersUsersGetOptions({ headers, query: { limit: 200 } }),
    enabled: Boolean(headers),
    staleTime: 60_000,
  });
  const users: User[] = (usersQuery.data?.data ?? []).filter(u => !!u.id);

  // Statuses
  const statusesQuery = useQuery({
    ...readStatusesStatusesGetOptions({
      headers,
      query: { entity_type: 'Task', sort_by: 'name', sort_order: 'asc' },
    }),
    enabled: Boolean(headers),
    staleTime: 60_000,
  });
  const statuses: (Pick<Status, 'id' | 'name'> & { name: string })[] =
      (statusesQuery.data?.data ?? [])
          .filter(s => s?.id && s?.name && ALLOWED_STATUS_NAMES.has(s.name))
          .map(s => ({ id: s.id, name: s.name ?? '' }));

  // Priorities via TypeLookups (keep lookup logic; we store/send priority_id)
  const prioritiesQuery = useQuery({
    ...readTypeLookupsTypeLookupsGetOptions({
      headers,
      query: {
        $filter: "type_name eq 'TaskPriority'",
        sort_by: 'type_value',
        sort_order: 'asc',
        limit: 100,
      },
    }),
    enabled: Boolean(headers),
    staleTime: 60_000,
  });
  const priorityLookups: TypeLookup[] =
      (prioritiesQuery.data?.data ?? []).filter(p => !!p.id);

  // Derive priority options (id + label)
  const priorityOptions = useMemo(
      () =>
          priorityLookups.map(p => ({
            id: p.id,
            label: p.type_value ?? '',
          })),
      [priorityLookups]
  );

  // Defaults after data loads
  const isBootLoading = !headers || statusesQuery.isLoading || prioritiesQuery.isLoading;

  useEffect(() => {
    // Default status: "Open" or first
    if (!formData.status_id && statuses.length > 0) {
      const open = statuses.find(s => s.name === 'Open') ?? statuses[0];
      setFormData(prev => ({ ...prev, status_id: open.id??'open:relation-failed' }));
    }
  }, [statuses, formData.status_id]);

  useEffect(() => {
    // Default priority: "Medium" by label, or the first available
    if (!formData.priority_id && priorityOptions.length > 0) {
      const medium = priorityOptions.find(p => p.label.toLowerCase() === 'medium') ?? priorityOptions[0];
      setFormData(prev => ({ ...prev, priority_id: medium.id }));
    }
  }, [priorityOptions, formData.priority_id]);

  // Bootstrap error handling
  useEffect(() => {
    const err =
        (statusesQuery.isError && (statusesQuery.error as Error)?.message) ||
        (prioritiesQuery.isError && (prioritiesQuery.error as Error)?.message) ||
        null;

    if (err) {
      setBootError(err);
      show(err, { severity: 'error' });
    } else {
      setBootError(null);
    }
  }, [statusesQuery.isError, statusesQuery.error, prioritiesQuery.isError, prioritiesQuery.error, show]);

  // Create task mutation
  const createTaskMutation = useMutation({
    ...createTaskTasksPostMutation({ headers }),
    onSuccess: () => {
      show('Task created successfully', { severity: 'success' });
      router.push('/tasks');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      show(msg, { severity: 'error' });
    },
  });

  // Handlers
  const handleText =
      (field: 'title' | 'description') =>
          (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, [field]: value }));
          };

  const handleSelectString =
      (field: 'status_id' | 'priority_id' | 'assignee_id') =>
          (e: SelectChangeEvent) => {
            const value = e.target.value;
            setFormData(prev => ({
              ...prev,
              [field]: value === '' ? undefined : value,
            }));
          };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      show('Please enter a task title', { severity: 'error' });
      return;
    }
    if (!formData.status_id) {
      show('Please select a status', { severity: 'error' });
      return;
    }
    if (!formData.priority_id) {
      show('Please select a priority', { severity: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await createTaskMutation.mutateAsync({
        body: {
          title: formData.title,
          description: formData.description,
          status_id: formData.status_id,
          priority_id: formData.priority_id, // ✅ send lookup ID
          assignee_id: formData.assignee_id || undefined,
          entity_type: formData.entity_type,
          entity_id: formData.entity_id,
          task_metadata: formData.task_metadata,
        } satisfies TaskCreate,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading UI while bootstrapping
  if (isBootLoading) {
    return (
        <PageContainer
            title="Create Task"
            breadcrumbs={[
              { title: 'Tasks', path: '/tasks' },
              { title: 'Create Task', path: '/tasks/create' },
            ]}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        </PageContainer>
    );
  }

  return (
      <PageContainer
          title="Create Task"
          breadcrumbs={[
            { title: 'Tasks', path: '/tasks' },
            { title: 'Create Task', path: '/tasks/create' },
          ]}
      >
        <Box sx={{ flexGrow: 1, pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                {bootError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {bootError}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                          fullWidth
                          label="Task Title"
                          value={formData.title}
                          onChange={handleText('title')}
                          required
                          disabled={isSaving}
                          placeholder={
                            formData.task_metadata?.comment_id
                                ? 'Enter task title related to the comment...'
                                : formData.entity_type
                                    ? `Enter task title for ${formData.entity_type}...`
                                    : 'Enter task title...'
                          }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={isSaving}>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select<string>
                            labelId="status-label"
                            value={formData.status_id ?? ''}
                            onChange={handleSelectString('status_id')}
                            label="Status"
                        >
                          {statuses.map(s => (
                              <MenuItem key={s.id} value={s.id??undefined}>
                                {s.name}
                              </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={isSaving}>
                        <InputLabel id="priority-label">Priority</InputLabel>
                        <Select<string>
                            labelId="priority-label"
                            value={formData.priority_id ?? ''}
                            onChange={handleSelectString('priority_id')}
                            label="Priority"
                        >
                          {priorityOptions.map(p => (
                              <MenuItem key={p.id} value={p.id??undefined}>
                                {p.label}
                              </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth disabled={isSaving || usersQuery.isLoading}>
                        <InputLabel id="assignee-label" shrink>
                          Assignee
                        </InputLabel>
                        <Select<string>
                            labelId="assignee-label"
                            value={formData.assignee_id ?? ''}
                            onChange={handleSelectString('assignee_id')}
                            label="Assignee"
                            displayEmpty
                            sx={{
                              '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                paddingTop: theme.spacing(2),
                                paddingBottom: theme.spacing(2),
                              },
                            }}
                            renderValue={selected => {
                              const u = users.find(user => user.id === selected);
                              if (!u) {
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar
                                          sx={{
                                            width: AVATAR_SIZES.SMALL,
                                            height: AVATAR_SIZES.SMALL,
                                            bgcolor: 'grey.300',
                                          }}
                                      >
                                        U
                                      </Avatar>
                                      <Typography variant="body1">Unassigned</Typography>
                                    </Box>
                                );
                              }
                              return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={u.picture ?? undefined}
                                        alt={u.name ?? 'User'}
                                        sx={{
                                          width: AVATAR_SIZES.SMALL,
                                          height: AVATAR_SIZES.SMALL,
                                          bgcolor: 'primary.main',
                                        }}
                                    >
                                      {u.name?.charAt(0) ?? 'U'}
                                    </Avatar>
                                    <Typography variant="body1">{u.name ?? u.email ?? 'User'}</Typography>
                                  </Box>
                              );
                            }}
                        >
                          <MenuItem value="">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                  sx={{
                                    width: AVATAR_SIZES.SMALL,
                                    height: AVATAR_SIZES.SMALL,
                                    bgcolor: 'grey.300',
                                  }}
                              >
                                U
                              </Avatar>
                              <Typography variant="body1">Unassigned</Typography>
                            </Box>
                          </MenuItem>

                          {users.map(u => (
                              <MenuItem key={u.id} value={u.id??undefined}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar
                                      src={u.picture ?? undefined}
                                      alt={u.name ?? 'User'}
                                      sx={{
                                        width: AVATAR_SIZES.SMALL,
                                        height: AVATAR_SIZES.SMALL,
                                        bgcolor: 'primary.main',
                                      }}
                                  >
                                    {u.name?.charAt(0) ?? 'U'}
                                  </Avatar>
                                  <Typography variant="body1">{u.name ?? u.email ?? 'User'}</Typography>
                                </Box>
                              </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                          fullWidth
                          label="Description"
                          value={formData.description ?? ''}
                          onChange={handleText('description')}
                          multiline
                          rows={4}
                          disabled={isSaving}
                          placeholder={
                            formData.task_metadata?.comment_id
                                ? 'Describe the task related to this comment...'
                                : formData.entity_type
                                    ? `Describe the task for ${formData.entity_type}...`
                                    : 'Describe the task...'
                          }
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={() => router.push('/tasks')} disabled={isSaving}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={isSaving}>
                          {isSaving ? 'Creating...' : 'Create Task'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </PageContainer>
  );
}
