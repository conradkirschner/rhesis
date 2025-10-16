'use client';

import * as React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Avatar,
  Typography,
  useTheme,
} from '@mui/material';
import type {
  UiPriorityOption,
  UiStatusOption,
  UiTaskFormState,
  UiUserOption,
} from '../types';
import { AVATAR_SIZES } from '@/constants/avatar-sizes';

type Props = Readonly<{
  form: UiTaskFormState;
  users: readonly UiUserOption[];
  statusOptions: readonly UiStatusOption[];
  priorityOptions: readonly UiPriorityOption[];
  isSaving: boolean;
  onChange: (patch: Partial<UiTaskFormState>) => void;
}>;

export function StepForm({
  form,
  users,
  statusOptions,
  priorityOptions,
  isSaving,
  onChange,
}: Props) {
  const theme = useTheme();

  return (
    <Box component="form" noValidate autoComplete="off">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Task Title"
            value={form.title}
            onChange={e => onChange({ title: e.target.value })}
            required
            disabled={isSaving}
            inputProps={{ 'data-test-id': 'field-title' }}
            placeholder={
              form.commentId
                ? 'Enter task title related to the comment...'
                : form.entityType
                ? `Enter task title for ${form.entityType}...`
                : 'Enter task title...'
            }
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={isSaving}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              value={form.statusId}
              onChange={e => onChange({ statusId: e.target.value })}
              inputProps={{ 'data-test-id': 'field-status' }}
            >
              {statusOptions.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={isSaving}>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              label="Priority"
              value={form.priorityId}
              onChange={e => onChange({ priorityId: e.target.value })}
              inputProps={{ 'data-test-id': 'field-priority' }}
            >
              {priorityOptions.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth disabled={isSaving}>
            <InputLabel id="assignee-label" shrink>
              Assignee
            </InputLabel>
            <Select
              labelId="assignee-label"
              label="Assignee"
              displayEmpty
              value={form.assigneeId ?? ''}
              onChange={e =>
                onChange({ assigneeId: (e.target.value as string) || undefined })
              }
              inputProps={{ 'data-test-id': 'field-assignee' }}
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
                      src={u.picture}
                      alt={u.label}
                      sx={{
                        width: AVATAR_SIZES.SMALL,
                        height: AVATAR_SIZES.SMALL,
                        bgcolor: 'primary.main',
                      }}
                    >
                      {u.label.charAt(0)}
                    </Avatar>
                    <Typography variant="body1">{u.label}</Typography>
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
                <MenuItem key={u.id} value={u.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={u.picture}
                      alt={u.label}
                      sx={{
                        width: AVATAR_SIZES.SMALL,
                        height: AVATAR_SIZES.SMALL,
                        bgcolor: 'primary.main',
                      }}
                    >
                      {u.label.charAt(0)}
                    </Avatar>
                    <Typography variant="body1">{u.label}</Typography>
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
            value={form.description}
            onChange={e => onChange({ description: e.target.value })}
            multiline
            rows={4}
            disabled={isSaving}
            inputProps={{ 'data-test-id': 'field-description' }}
            placeholder={
              form.commentId
                ? 'Describe the task related to this comment...'
                : form.entityType
                ? `Describe the task for ${form.entityType}...`
                : 'Describe the task...'
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
}