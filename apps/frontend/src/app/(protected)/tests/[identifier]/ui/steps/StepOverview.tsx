'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import type { UiCurrentUser } from '../types';

export interface UiStepOverviewProps {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly createdAtISO: string | null;
  readonly owner: { readonly id: string; readonly name: string; readonly avatarUrl?: string } | null;
  readonly currentUser: UiCurrentUser;
}

export default function StepOverview({
  id,
  title,
  status,
  createdAtISO,
  owner,
  currentUser,
}: UiStepOverviewProps) {
  const createdLabel = createdAtISO ? new Date(createdAtISO).toLocaleString() : '—';

  return (
    <Stack spacing={1} data-test-id="step-overview">
      <Typography variant="h6">{title}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip label={`ID: ${id}`} size="small" />
        <Chip label={status || 'unknown'} color="default" size="small" />
        <Chip label={`Created: ${createdLabel}`} size="small" />
      </Stack>
      {owner ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src={owner.avatarUrl} alt={owner.name} />
          <Typography variant="body2" color="text.secondary">
            Owner: {owner.name}
          </Typography>
        </Stack>
      ) : null}
      <Typography variant="body2" color="text.secondary">
        Viewing as {currentUser.name || 'user'}
      </Typography>
    </Stack>
  );
}