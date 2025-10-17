'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import CommentsWrapper from '@/components/comments/CommentsWrapper';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';
import type { UiTaskView, UiUserView } from '../types';

type Props = {
  readonly task: UiTaskView;
  readonly users: readonly UiUserView[];
  readonly isSaving: boolean;
  readonly isUsersLoading: boolean;
  readonly currentUser?: UiUserView;
  readonly onNavigateToEntity?: () => void;
  readonly onChangeStatus: (statusId: string) => void;
  readonly onChangePriority: (priorityId: string) => void;
  readonly onChangeAssignee: (assigneeId: string | null) => void;
  readonly onSaveTitle: (title: string) => void;
  readonly onSaveDescription: (description: string) => void;
};

export default function StepDetails({
  task,
  users,
  isSaving,
  isUsersLoading,
  currentUser,
  onNavigateToEntity,
  onChangeStatus,
  onChangePriority,
  onChangeAssignee,
  onSaveTitle,
  onSaveDescription,
}: Props) {
  const hasInitialLoadRef = useRef(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      setEditTitle(task.title ?? '');
      setEditDescription(task.description ?? '');
      hasInitialLoadRef.current = true;
    }
  }, [task.description, task.title]);

  const creator = useMemo(
    () => ({
      id: task.creator?.id ?? '',
      name: task.creator?.name ?? 'Unknown',
      picture: task.creator?.picture,
    }),
    [task.creator],
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
                {task.title || 'Untitled Task'}
              </Typography>
              {task.entityType && task.entityId ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onNavigateToEntity}
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
                      <NorthEastIcon fontSize="inherit" sx={{ color: 'background.paper', fontSize: 12 }} />
                    </Box>
                  }
                  data-test-id="navigate-associated-entity"
                >
                  {task.commentId ? 'Go to associated comment' : `Go to ${task.entityType}`}
                </Button>
              ) : null}
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    label="Status"
                    value={task.statusId || ''}
                    onChange={(e) => onChangeStatus(String(e.target.value))}
                    data-test-id="status-select"
                  >
                    <MenuItem value="todo">To Do</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="done">Done</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Priority"
                    value={task.priorityId || ''}
                    onChange={(e) => onChangePriority(String(e.target.value))}
                    data-test-id="priority-select"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled>
                  <InputLabel id="creator-label">Creator</InputLabel>
                  <Select
                    labelId="creator-label"
                    label="Creator"
                    value={creator.id}
                    renderValue={() => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={creator.picture}
                          alt={creator.name}
                          sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
                        >
                          {creator.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body1">{creator.name}</Typography>
                      </Box>
                    )}
                    data-test-id="creator-select"
                  >
                    <MenuItem value={creator.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={creator.picture}
                          alt={creator.name}
                          sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
                        >
                          {creator.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body1">{creator.name}</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isSaving || isUsersLoading}>
                  <InputLabel id="assignee-label" shrink>
                    Assignee
                  </InputLabel>
                  <Select
                    labelId="assignee-label"
                    label="Assignee"
                    value={task.assigneeId || ''}
                    displayEmpty
                    onChange={(e) => onChangeAssignee(String(e.target.value) || null)}
                    data-test-id="assignee-select"
                    sx={{
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 2,
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
                            src={u.picture}
                            alt={u.name ?? 'User'}
                            sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
                          >
                            {(u.name ?? u.email ?? 'U').charAt(0)}
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
                              src={u.picture}
                              alt={u.name ?? 'User'}
                              sx={{ width: AVATAR_SIZES.SMALL, height: AVATAR_SIZES.SMALL, bgcolor: 'primary.main' }}
                            >
                              {(u.name ?? u.email ?? 'U').charAt(0)}
                            </Avatar>
                            <Typography variant="body1">{u.name ?? u.email ?? 'User'}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Task Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Key information about this task.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Title
                </Typography>
                {!isEditingTitle ? (
                  <Tooltip title="Edit title">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditTitle(task.title ?? '');
                        setIsEditingTitle(true);
                      }}
                      sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                      data-test-id="edit-title"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>

              {isEditingTitle ? (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Enter task title…"
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
                      data-test-id="cancel-title"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onSaveTitle(editTitle.trim())}
                      disabled={isSaving || !editTitle.trim()}
                      sx={{ textTransform: 'none', borderRadius: '16px' }}
                      data-test-id="save-title"
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    minHeight: '24px',
                    color: task.title ? 'text.primary' : 'text.secondary',
                    fontStyle: task.title ? 'normal' : 'italic',
                  }}
                >
                  {task.title || 'No title set'}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                {!isEditingDescription ? (
                  <Tooltip title="Edit description">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditDescription(task.description ?? '');
                        setIsEditingDescription(true);
                      }}
                      sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                      data-test-id="edit-description"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
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
                      data-test-id="cancel-description"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onSaveDescription(editDescription.trim())}
                      disabled={isSaving || !editDescription.trim()}
                      sx={{ textTransform: 'none', borderRadius: '16px' }}
                      data-test-id="save-description"
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography sx={{ mb: 2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }} variant="body2" color="text.primary">
                  {task.description || 'No description provided'}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box>
              <CommentsWrapper
                entityType="Task"
                entityId={task.id}
                currentUserId={currentUser?.id ?? ''}
                currentUserName={currentUser?.name ?? 'Unknown User'}
                currentUserPicture={currentUser?.picture}
                onCreateTask={undefined}
              />
            </Box>

            {isRefetching ? (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Reconnecting…
                </Typography>
              </Box>
            ) : null}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}