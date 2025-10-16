'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BaseDrawer from '@/components/common/BaseDrawer';
import {
  Autocomplete,
  TextField,
  Box,
  Avatar,
  MenuItem,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useMutation, useQuery } from '@tanstack/react-query';

import type {TestSet, User, TestSetCreate, StatusDetail} from '@/api-client/types.gen';

import {
  readStatusesStatusesGetOptions,
  readUsersUsersGetOptions,
  createTestSetTestSetsPostMutation,
  updateTestSetTestSetsTestSetIdPutMutation,
} from '@/api-client/@tanstack/react-query.gen';
import { useSession } from 'next-auth/react';

// Priority levels mapping (same as in TestDrawer)
const PRIORITY_LEVELS = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Urgent' },
];

interface TestSetDrawerProps {
  open: boolean;
  onClose: () => void;
  testSet?: TestSet;
  onSuccess?: () => void;
}

export default function TestSetDrawer({
                                        open,
                                        onClose,
                                        testSet,
                                        onSuccess,
                                      }: TestSetDrawerProps) {
  const session = useSession()
  const sessionToken = session.data?.session_token
  const [error, setError] = useState<string | undefined>(undefined);
  const [name, setName] = useState(testSet?.name || '');
  const [description, setDescription] = useState(testSet?.description || '');
  const [shortDescription, setShortDescription] = useState(testSet?.short_description || '');
  const [status, setStatus] = useState<StatusDetail | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [priority, setPriority] = useState<number>(testSet?.priority ?? 1);

  const statusesQuery = useQuery({
    ...readStatusesStatusesGetOptions(
        { query: { entity_type: 'TestSet', sort_by: 'name', sort_order: 'asc' }},
    ),
    enabled: open ,
  });

  const usersQuery = useQuery({
    ...readUsersUsersGetOptions(),
    enabled: open ,
  });

  const statuses: StatusDetail[] = statusesQuery.data?.data ?? [];

  const users: User[] = usersQuery.data?.data?? [];

  const createMutation = useMutation({
    ...createTestSetTestSetsPostMutation(),
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      console.error('Error creating test set:', err);
      setError('Failed to save test set');
    },
  });

  const updateMutation = useMutation({
    ...updateTestSetTestSetsTestSetIdPutMutation(),
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      console.error('Error updating test set:', err);
      setError('Failed to save test set');
    },
  });

  const loading =
      statusesQuery.isFetching ||
      usersQuery.isFetching ||
      createMutation.isPending ||
      updateMutation.isPending;

  const currentUserId = session?.data?.user?.id

  useEffect(() => {
    if (!open) return;

    // status default (edit mode uses testSet.status_id)
    if (statuses.length) {
      if (testSet?.status_id) {
        const found = statuses.find((s) => s.id === testSet.status_id) ?? null;
        if (!found) {
          return;
        }
        setStatus(found);
      } else {
        setStatus((prev) => prev ?? null);
      }
    }

    // assignee default (edit mode uses testSet.assignee_id)
    if (users.length) {
      if (testSet?.assignee_id) {
        const found = users.find((u) => u.id === testSet.assignee_id) ?? null;
        setAssignee(found);
      } else {
        setAssignee((prev) => prev ?? null);
      }

      // owner default: edit -> testSet.owner_id, create -> current user if present
      if (testSet?.owner_id) {
        const found = users.find((u) => u.id === testSet.owner_id) ?? null;
        setOwner(found);
      } else if (!testSet && currentUserId) {
        const me = users.find((u) => u.id === currentUserId) ?? null;
        setOwner(me);
      }
    }
  }, [open, statuses.length, users.length, testSet, currentUserId, statuses, users]);

  // ---- save
  const handleSave = useCallback(async () => {
    setError(undefined);

    const body: TestSetCreate = {
      name,
      description,
      short_description: shortDescription,
      status_id: status?.id ?? undefined,
      assignee_id: assignee?.id ?? undefined,
      owner_id: owner?.id ?? undefined,
      priority,
      visibility: 'organization',
      is_published: false,
      attributes: {},
      // include tags etc. here if needed by your schema
    };

    if (testSet?.id) {
      await updateMutation.mutateAsync({
        path: { test_set_id: testSet.id },
        body,
      });
    } else {
      await createMutation.mutateAsync({ body });
    }
  }, [
    name,
    description,
    shortDescription,
    status?.id,
    assignee?.id,
    owner?.id,
    priority,
    testSet?.id,
    updateMutation,
    createMutation,
  ]);

  const getUserDisplayName = (user: User) =>
      user.name ||
      `${user.given_name ?? ''} ${user.family_name ?? ''}`.trim() ||
      user.email ||
      '';

  const renderUserOption = (
      props: React.HTMLAttributes<HTMLLIElement> & { key?: string },
      option: User,
  ) => {
    const { key, ...otherProps } = props;
    return (
        <Box component="li" key={key} {...otherProps}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={option.picture ?? undefined} sx={{ width: 24, height: 24 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            {getUserDisplayName(option)}
          </Box>
        </Box>
    );
  };

  return (
      <BaseDrawer
          open={open}
          onClose={onClose}
          title={testSet ? 'Edit Test Set' : 'New Test Set'}
          loading={loading}
          error={error}
          onSave={handleSave}
      >
        <Stack spacing={3}>
          {/* Workflow Section */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Workflow
            </Typography>

            <Stack spacing={2}>
              <Autocomplete
                  options={statuses}
                  value={status}
                  onChange={(_, v) => setStatus(v)}
                  getOptionLabel={(o) => o?.name ?? ''}
                  fullWidth
                  renderInput={(params) => <TextField {...params} label="Status" required />}
                  loading={statusesQuery.isFetching}
              />

              <TextField
                  select
                  label="Priority"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  fullWidth
                  required
              >
                {PRIORITY_LEVELS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                ))}
              </TextField>

              <Autocomplete
                  options={users}
                  value={assignee}
                  onChange={(_, v) => setAssignee(v)}
                  getOptionLabel={getUserDisplayName}
                  renderOption={renderUserOption}
                  fullWidth
                  renderInput={(params) => <TextField {...params} label="Assignee" />}
                  loading={usersQuery.isFetching}
              />

              <Autocomplete
                  options={users}
                  value={owner}
                  onChange={(_, v) => setOwner(v)}
                  getOptionLabel={getUserDisplayName}
                  renderOption={renderUserOption}
                  fullWidth
                  renderInput={(params) => <TextField {...params} label="Owner" required />}
                  loading={usersQuery.isFetching}
              />
            </Stack>
          </Stack>

          <Divider />

          {/* Test Set Details Section */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Test Set Details
            </Typography>

            <Stack spacing={2}>
              <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
              />

              <TextField
                  label="Short Description"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  fullWidth
              />

              <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
              />
            </Stack>
          </Stack>
        </Stack>
      </BaseDrawer>
  );
}
