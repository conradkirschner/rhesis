'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export function InlineLoader({ label = 'Loading...' }: { readonly label?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography>{label}</Typography>
    </Box>
  );
}