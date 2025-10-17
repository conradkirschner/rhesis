'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';

interface StepperHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
}

export default function StepperHeader({ title, subtitle }: StepperHeaderProps) {
  return (
    <Box sx={{ px: 3, pt: 2, pb: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}