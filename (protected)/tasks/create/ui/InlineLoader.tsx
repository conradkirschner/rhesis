'use client';

import { Box, CircularProgress } from '@mui/material';

export function InlineLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
      <CircularProgress />
    </Box>
  );
}