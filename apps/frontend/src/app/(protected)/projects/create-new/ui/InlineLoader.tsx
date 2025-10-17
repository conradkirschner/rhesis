'use client';

import * as React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { UiInlineLoaderProps } from './types';

export default function InlineLoader({ label = 'Loading...' }: UiInlineLoaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 200, justifyContent: 'center' }}>
      <CircularProgress />
      <Typography>{label}</Typography>
    </Box>
  );
}