'use client';

import { Box, CircularProgress } from '@mui/material';

export default function InlineLoader() {
  return (
    <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress size={24} />
    </Box>
  );
}