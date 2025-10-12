'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import BaseDrawer from '@/components/common/BaseDrawer';
import { EntityType } from '@/types/tasks';
import { getEntityDisplayName } from '@/utils/entity-helpers';

import type { User } from '@/api-client/types.gen';
import { readUsersUsersGetOptions } from '@/api-client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';

type NewTaskPayload = {
  title: string;
  description?: string;
  /** Backend expects a number (e.g., 0..3) */
  priority?: number;
  assignee_id?: string;
  entity_type: EntityType;
  entity_id: string;
  task_metadata?: { comment_id?: string };
};

interface TaskCreationDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (taskData: NewTaskPayload) => Promise<void>;
  entityType: EntityType;
  entityId: string;
  currentUserId: string;   // kept for parity if parent needs them
  currentUserName: string; // kept for parity if parent needs them
  isLoading?: boolean;
  commentId?: string;
}

/** Friendly labels for numeric priority values */
const PRIORITY_LABELS: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Urgent',
};
const PRIORITY_VALUES = [0, 1, 2, 3] as const;

export function TaskCreationDrawer({
                                     open,
                                     onClose,
                                     onSubmit,
                                     entityType,
                                     entityId,
                                     isLoading = false,
                                     commentId,
                                   }: TaskCreationDrawerProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  /** Store the numeric priority */
  const [priority, setPriority] = useState<number | ''>('');
  const [assigneeId, setAssigneeId] = useState<string>('');

  // Users list via generated options
  const usersOptions = useMemo(
      () => readUsersUsersGetOptions({ query: { limit: 100, sort_by: 'name', sort_order: 'asc' } }),
      []
  );
  const usersQuery = useQuery({ ...usersOptions, enabled: open });

  const users: User[] =
      (usersQuery.data as { data?: User[] } | undefined)?.data?.filter(u => u?.id) ?? [];

  const isLoadingData = open && usersQuery.isLoading;

  // Reset form each time the drawer opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setPriority('');
      setAssigneeId('');
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const payload: NewTaskPayload = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority: priority === '' ? undefined : priority,
      assignee_id: assigneeId || undefined,
      entity_type: entityType,
      entity_id: entityId,
      task_metadata: commentId ? { comment_id: commentId } : undefined,
    };

    await onSubmit(payload);

    // Reset after successful submit
    setTitle('');
    setDescription('');
    setPriority('');
    setAssigneeId('');
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setDescription('');
      setPriority('');
      setAssigneeId('');
      onClose();
    }
  };

  return (
      <BaseDrawer
          open={open}
          onClose={handleClose}
          title="Create New Task"
          loading={isLoading}
          onSave={handleSubmit}
          saveButtonText={isLoading ? 'Creating...' : 'Create Task'}
          width={600}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Comment context info */}
          {commentId && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>From comment on:</strong> {getEntityDisplayName(entityType)}
                </Typography>
              </Box>
          )}

          {/* Title */}
          <TextField
              label="Task Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
              variant="outlined"
              placeholder="Enter a brief description of the task"
              disabled={isLoading}
          />

          {/* Description */}
          <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Provide detailed information about what needs to be done"
              disabled={isLoading}
          />

          {/* Priority + Assignee */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Priority (numeric) */}
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                  value={priority}
                  onChange={e => setPriority(e.target.value as number)}
                  label="Priority"
                  disabled={isLoadingData || isLoading}
                  displayEmpty
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {PRIORITY_VALUES.map(p => (
                    <MenuItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Assignee */}
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  label="Assignee"
                  disabled={isLoadingData || isLoading}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {users.map(u => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name || `${u.given_name ?? ''} ${u.family_name ?? ''}`.trim() || u.email || u.id}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Entity Info */}
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Related to:</strong> {getEntityDisplayName(entityType)}
            </Typography>
            {commentId && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <strong>From comment:</strong> This task was created from a comment
                </Typography>
            )}
          </Box>
        </Box>
      </BaseDrawer>
  );
}

export default TaskCreationDrawer;
