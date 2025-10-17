import * as React from 'react';
import { Box, Typography } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader({ title, description, subtitle }: UiStepperHeaderProps) {
  return (
    <Box textAlign="center" mb={4}>
      <Typography variant="h5" component="h2" gutterBottom color="primary">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      ) : null}
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}