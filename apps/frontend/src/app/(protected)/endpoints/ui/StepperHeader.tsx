'use client';

import { Box, Typography } from '@mui/material';

export interface StepperHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
}

export default function StepperHeader({ title, subtitle }: StepperHeaderProps) {
  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <Typography variant="h5">{title}</Typography>
      {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
    </Box>
  );
}