'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';

export default function StepperHeader(props: { title?: string; subtitle?: string }) {
  const { title = 'Dashboard', subtitle } = props;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}