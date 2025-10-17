'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

export interface UiStepperHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly ownerName?: string;
  readonly ownerAvatarUrl?: string;
}

export default function StepperHeader({ title, subtitle, ownerName, ownerAvatarUrl }: UiStepperHeaderProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" data-test-id="stepper-header">
      <Avatar src={ownerAvatarUrl} alt={ownerName} />
      <Stack>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>
    </Stack>
  );
}