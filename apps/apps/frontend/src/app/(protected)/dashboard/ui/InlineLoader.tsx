'use client';

import { Box, CircularProgress } from '@mui/material';

export default function InlineLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress />
    </Box>
  );
}