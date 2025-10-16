'use client';

import * as React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function InlineLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}