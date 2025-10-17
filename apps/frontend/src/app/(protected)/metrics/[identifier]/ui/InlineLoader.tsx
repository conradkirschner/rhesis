'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export default function InlineLoader({ label }: { label: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 120,
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={20} />
      <Typography>{label}</Typography>
    </Box>
  );
}