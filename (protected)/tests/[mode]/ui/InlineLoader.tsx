'use client';

import { CircularProgress, Box } from '@mui/material';

export default function InlineLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}