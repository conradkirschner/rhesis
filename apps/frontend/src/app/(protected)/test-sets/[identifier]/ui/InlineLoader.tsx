'use client';

import * as React from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { UiInlineLoaderProps } from './types';

export default function InlineLoader({ show }: UiInlineLoaderProps) {
  if (!show) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <CircularProgress />
    </Box>
  );
}