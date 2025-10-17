'use client';

import { Box, CircularProgress } from '@mui/material';

export default function InlineLoader() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 6 }}>
      <CircularProgress />
    </Box>
  );
}