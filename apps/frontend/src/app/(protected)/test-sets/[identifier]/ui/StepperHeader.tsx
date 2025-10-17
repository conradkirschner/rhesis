'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader({ title, subtitle }: UiStepperHeaderProps) {
  return (
    <Box sx={{ pt: 3, pb: 1 }}>
      <Typography variant="h5" sx={{ mb: subtitle ? 0.5 : 0 }}>
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