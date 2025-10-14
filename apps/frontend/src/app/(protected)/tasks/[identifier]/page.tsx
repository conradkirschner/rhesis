'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { ArrowOutwardIcon, EditIcon } from '@/components/icons';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useNotifications } from '@/components/common/NotificationContext';
import CommentsWrapper from '@/components/comments/CommentsWrapper';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { TaskDetail, TaskUpdate, UserReference } from '@/api-client/types.gen';

import {
  getTaskTasksTaskIdGetOptions,
  updateTaskTasksTaskIdPatchMutation,
  readUsersUsersGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

interface PageProps {
  params: Promise<{ identifier: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { show } = useNotifications();
  const queryClient = useQueryClient();

  const resolvedParams = use(params);
  const taskId = resolvedParams.identifier;

  const [isSaving, setIsSaving] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const hasInitialLoadRef = useRef(false);

  const headers = useMemo(
      () =>
          session?.session_token
              ? { Authorization: `Bearer ${session.session_token}` }
              : undefined,
      [session?.session_token]
  );

  const taskKey = useMemo(
      () =>
          getTaskTasksTaskIdGetOptions({
            headers,
            path: { task_id: taskId },
          }).queryKey,
      [headers, taskId]
  );

  const setTaskCache = (
      updater: Partial<TaskDetail> | ((prev?: TaskDetail) => TaskDetail)
  ) => {
    queryClient.setQueryData<TaskDetail>(taskKey, (prev) => {
      const base: TaskDetail =
          prev ??
          ({
            id: taskId,
          } as TaskDetail);
      const next =
          typeof updater === 'function'
              ? (updater as (p?: TaskDetail) => TaskDetail)(base)
              : { ...base, ...updater };
      return { ...next, id: (next.id ?? taskId) as string };
    });
  };

  const taskQuery = useQuery({
    ...getTaskTasksTaskIdGetOptions({
      headers,
      path: { task_id: taskId },
    }),
    enabled: Boolean(headers && taskId),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });

  const usersQuery = useQuery({
    ...readUsersUsersGetOptions({ headers }),
    enabled: Boolean(headers),
    staleTime: 60_000,
  });

  const updateTaskMutation = useMutation({
    ...updateTaskTasksTaskIdPatchMutation({ headers }),
    onSuccess: (updated) => {
      setTaskCache(updated as TaskDetail);
      show('Task updated successfully', { severity: 'success' });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      show(msg, { severity: 'error' });
    },
  });

  const task = taskQuery.data as TaskDetail | undefined;
  const users = (usersQuery.data as UserReference[] | undefined) ?? [];

  const isFetching = taskQuery.fetchStatus === 'fetching';
  const hasData = !!task;
  const isRefetching = isFetching && hasData;

  // Init local edit fields
  useEffect(() => {
    if (task && !hasInitialLoadRef.current) {
      setEditDescription(task.description ?? '');
      setEditTitle(task.title ?? '');
      hasInitialLoadRef.current = true;
    }
  }, [task]);

  // Loading timeout
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (taskQuery.isLoading && headers && taskId) {
      timeoutId = setTimeout(() => setLoadingTimeout(true), 10_000);
    } else {
      setLoadingTimeout(false);
    }
    return () => timeoutId && clearTimeout(timeoutId);
  }, [taskQuery.isLoading, headers, taskId]);

  // Loading UI
  if (taskQuery.isLoading) {
    return (
        <PageContainer
            title={loadingTimeout ? 'Taking longer than expected...' : 'Loading...'}
            breadcrumbs={[
              { title: 'Tasks', path: '/tasks' },
              { title: loadingTimeout ? 'Slow Connection' : 'Loading...', path: `/tasks/${taskId}` },
            ]}
        >
          <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                gap: 3,
              }}
          >
            <CircularProgress />
            {loadingTimeout && (
                <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      This is taking longer than usual
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      The server might be experiencing high load or there could be a network issue.
                      We&apos;re still trying to load your task.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Task ID: {taskId}
                    </Typography>
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button variant="contained" onClick={() => router.push('/tasks')}>
                      Back to Tasks
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                          setLoadingTimeout(false);
                          void taskQuery.refetch();
                        }}
                    >
                      Try Again
                    </Button>
                  </Box>
                </Box>
            )}
          </Box>
        </PageContainer>
    );
  }

  // Error UI
  if (taskQuery.isError) {
    const msg = taskQuery.error.message;
    const fetchingNow = taskQuery.fetchStatus === 'fetching';
    return (
        <PageContainer
            title="Error"
            breadcrumbs={[
              { title: 'Tasks', path: '/tasks' },
              { title: 'Error', path: `/tasks/${taskId}` },
            ]}
        >
          <Box sx={{ flexGrow: 1, pt: 3 }}>
            <Alert
                severity="error"
                sx={{ mb: 3 }}
                action={
                  <Button color="inherit" size="small" onClick={() => taskQuery.refetch()} disabled={fetchingNow}>
                    {fetchingNow ? (
                        <>
                          <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                          Retrying...
                        </>
                    ) : (
                        'Retry'
                    )}
                  </Button>
                }
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Sorry, we couldn&apos;t load this task
              </Typography>
              <Box
                  sx={{
                    fontSize: (t) => t.typography.helperText.fontSize,
                    fontFamily: 'monospace',
                    color: 'text.secondary',
                    mt: 1,
                  }}
              >
                Error: {msg}
              </Box>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => router.push('/tasks')}>
                Back to Tasks
              </Button>
              <Button variant="outlined" onClick={() => taskQuery.refetch()} disabled={fetchingNow}>
                {fetchingNow ? (
                    <>
                      <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                      Retrying...
                    </>
                ) : (
                    'Try Again'
                )}
              </Button>
            </Box>
          </Box>
        </PageContainer>
    );
  }

  if (!task) {
    return (
        <PageContainer
            title="Task Not Found"
            breadcrumbs={[
              { title: 'Tasks', path: '/tasks' },
              { title: 'Not Found', path: `/tasks/${taskId}` },
            ]}
        >
          <Box sx={{ flexGrow: 1, pt: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Sorry, we couldn&apos;t load this task
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Task ID: {taskId}
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => router.push('/tasks')}>
                Back to Tasks
              </Button>
              <Button variant="outlined" onClick={() => taskQuery.refetch()}>
                Try Again
              </Button>
            </Box>
          </Box>
        </PageContainer>
    );
  }

  // Save helpers
  const saveTask = async (partial: Partial<TaskUpdate>) => {
    setIsSaving(true);
    try {
      await updateTaskMutation.mutateAsync({
        path: { task_id: task.id as string },
        body: partial,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectChange =
      (field: keyof TaskUpdate) =>
          (event: SelectChangeEvent) => {
            const value = event.target.value as string;
            // optimistic cache update (type-safe)
            setTaskCache({ [field]: value } as Partial<TaskDetail>);
            void saveTask({ [field]: value } as Partial<TaskUpdate>);
          };

  const handleSaveDescription = async () => {
    if (!editDescription.trim()) {
      show('Description cannot be empty', { severity: 'error' });
      return;
    }
    await saveTask({
      title: task.title ?? undefined,
      description: editDescription,
      status_id: task.status_id ?? undefined,
      priority_id: task.priority_id ?? undefined,
      assignee_id: task.assignee_id ?? undefined,
    });
    setIsEditingDescription(false);
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) {
      show('Task title cannot be empty', { severity: 'error' });
      return;
    }
    await saveTask({
      title: editTitle.trim(),
      description: task.description ?? undefined,
      status_id: task.status_id ?? undefined,
      priority_id: task.priority_id ?? undefined,
      assignee_id: task.assignee_id ?? undefined,
    });
    setIsEditingTitle(false);
  };

  // Show warning if we have cached data but a refetch failed (v5: infer via data + error)
  const hasCachedDataRefetchError = Boolean(taskQuery.data) && Boolean(taskQuery.error);

  return (
      <PageContainer
          breadcrumbs={[
            { title: 'Tasks', path: '/tasks' },
            { title: task.title ?? 'Untitled Task', path: `/tasks/${taskId}` },
          ]}
      >
        {/* Title & nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
            {task.title ?? 'Untitled Task'}
          </Typography>
          {task.entity_type && task.entity_id && (
              <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    try {
                      const entityPath = (task.entity_type ?? '').toLowerCase() + 's';
                      const baseUrl = `/${entityPath}/${task.entity_id}`;
                      const commentHash = task.task_metadata?.comment_id
                          ? `#comment-${task.task_metadata.comment_id}`
                          : '';
                      router.push(`${baseUrl}${commentHash}`);
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: 'divider',
                    px: 2,
                    py: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'text.primary',
                      borderColor: 'primary.main',
                    },
                  }}
                  endIcon={
                    <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                    >
                      <ArrowOutwardIcon sx={{ fontSize: '12px', color: 'background.paper' }} />
                    </Box>
                  }
              >
                {task.task_metadata?.comment_id ? 'Go to associated comment' : `Go to ${task.entity_type}`}
              </Button>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, pt: 3 }}>
          {hasCachedDataRefetchError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Connection Issue:</strong> Showing the last saved version of this task.
                </Typography>
                <Button
                    color="inherit"
                    size="small"
                    onClick={() => taskQuery.refetch()}
                    disabled={isRefetching}
                    variant="outlined"
                    sx={{ mt: 1 }}
                >
                  {isRefetching ? (
                      <>
                        <CircularProgress color="inherit" size={14} sx={{ mr: 1 }} />
                        Reconnecting...
                      </>
                  ) : (
                      'Try to Reconnect'
                  )}
                </Button>
              </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 4 }}>
                {/* Status & Priority */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth disabled={isSaving}>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select<string>
                          labelId="status-label"
                          value={task.status_id ?? ''}
                          onChange={handleSelectChange('status_id')}
                          label="Status"
                      >
                        {/* Replace with your statuses query */}
                        <MenuItem value="todo">To Do</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="done">Done</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth disabled={isSaving}>
                      <InputLabel id="priority-label">Priority</InputLabel>
                      <Select<string>
                          labelId="priority-label"
                          value={task.priority_id ?? ''}
                          onChange={handleSelectChange('priority_id')}
                          label="Priority"
                      >
                        {/* Replace with your priorities query */}
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Creator & Assignee */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth disabled>
                      <InputLabel id="creator-label">Creator</InputLabel>
                      <Select<string>
                          labelId="creator-label"
                          value={task.user?.id ?? ''}
                          label="Creator"
                          displayEmpty
                          sx={{
                            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 },
                          }}
                          renderValue={() => (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                    src={task.user?.picture ?? undefined}
                                    alt={task.user?.name ?? 'Unknown'}
                                    sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
                                >
                                  {task.user?.name?.charAt(0) ?? 'U'}
                                </Avatar>
                                <Typography variant="body1">{task.user?.name ?? 'Unknown'}</Typography>
                              </Box>
                          )}
                      >
                        <MenuItem value={task.user?.id ?? ''}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                                src={task.user?.picture ?? undefined}
                                alt={task.user?.name ?? 'Unknown'}
                                sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
                            >
                              {task.user?.name?.charAt(0) ?? 'U'}
                            </Avatar>
                            <Typography variant="body1">{task.user?.name ?? 'Unknown'}</Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6}>
                    <FormControl fullWidth disabled={isSaving || usersQuery.isLoading}>
                      <InputLabel id="assignee-label" shrink>
                        Assignee
                      </InputLabel>
                      <Select<string>
                          labelId="assignee-label"
                          value={task.assignee_id ?? ''}
                          onChange={handleSelectChange('assignee_id')}
                          label="Assignee"
                          displayEmpty
                          sx={{
                            '& .MuiSelect-select': {
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              paddingTop: 2,
                              paddingBottom: 2,
                            },
                          }}
                          renderValue={(selected) => {
                            const u = users.find((usr) => usr.id === selected);
                            if (!u) {
                              return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'grey.300' }}>
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
                                      sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
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
                            <Avatar sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'grey.300' }}>U</Avatar>
                            <Typography variant="body1">Unassigned</Typography>
                          </Box>
                        </MenuItem>

                        {users
                            .filter((u) => u.id)
                            .map((u) => (
                                <MenuItem key={u.id} value={u.id}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={u.picture ?? undefined}
                                        alt={u.name ?? 'User'}
                                        sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
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
                </Grid>

                {/* Task Details */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Task Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Key information about this task.
                  </Typography>
                </Box>

                {/* Title */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Title
                    </Typography>
                    {!isEditingTitle && (
                        <Tooltip title="Edit title">
                          <IconButton
                              onClick={() => {
                                setEditTitle(task.title ?? '');
                                setIsEditingTitle(true);
                              }}
                              size="small"
                              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                    )}
                  </Box>

                  {isEditingTitle ? (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Enter task title..."
                            error={!editTitle.trim()}
                            helperText={!editTitle.trim() ? 'Title cannot be empty' : ''}
                            sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                              size="small"
                              onClick={() => {
                                setIsEditingTitle(false);
                                setEditTitle(task.title ?? '');
                              }}
                              disabled={isSaving}
                              sx={{ textTransform: 'none', borderRadius: '16px' }}
                          >
                            Cancel
                          </Button>
                          <Button
                              size="small"
                              variant="contained"
                              onClick={handleSaveTitle}
                              disabled={isSaving || !editTitle.trim()}
                              sx={{ textTransform: 'none', borderRadius: '16px' }}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                  ) : (
                      <Typography
                          variant="body1"
                          sx={{
                            minHeight: '24px',
                            color: (task.title ?? '') ? 'text.primary' : 'text.secondary',
                            fontStyle: (task.title ?? '') ? 'normal' : 'italic',
                          }}
                      >
                        {task.title ?? 'No title set'}
                      </Typography>
                  )}
                </Box>

                {/* Description */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    {!isEditingDescription && (
                        <Tooltip title="Edit description">
                          <IconButton
                              onClick={() => {
                                setEditDescription(task.description ?? '');
                                setIsEditingDescription(true);
                              }}
                              size="small"
                              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                    )}
                  </Box>

                  {isEditingDescription ? (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                              size="small"
                              onClick={() => {
                                setIsEditingDescription(false);
                                setEditDescription(task.description ?? '');
                              }}
                              sx={{ textTransform: 'none', borderRadius: '16px' }}
                          >
                            Cancel
                          </Button>
                          <Button
                              size="small"
                              variant="contained"
                              onClick={handleSaveDescription}
                              disabled={isSaving || !editDescription.trim()}
                              sx={{ textTransform: 'none', borderRadius: '16px' }}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                  ) : (
                      <Typography sx={{ mb: 2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }} variant="body2" color="text.primary">
                        {task.description ?? 'No description provided'}
                      </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Comments */}
                <Box>
                  <CommentsWrapper
                      entityType="Task"
                      entityId={taskId}
                      currentUserId={session?.user?.id || ''}
                      currentUserName={session?.user?.name || 'Unknown User'}
                      currentUserPicture={session?.user?.picture || undefined}
                      onCreateTask={undefined}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </PageContainer>
  );
}
