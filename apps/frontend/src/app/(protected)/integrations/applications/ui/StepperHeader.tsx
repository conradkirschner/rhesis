'use client';

import { Stack, Typography } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader({ title, subtitle }: UiStepperHeaderProps) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
    </Stack>
  );
}