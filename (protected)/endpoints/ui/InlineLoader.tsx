'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export interface InlineLoaderProps {
  readonly label?: string;
}

export default function InlineLoader({ label = 'Loading…' }: InlineLoaderProps) {
  return (
    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <CircularProgress size={20} />
      <Typography>{label}</Typography>
    </Box>
  );
}