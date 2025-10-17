'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export type InlineLoaderProps = {
  readonly label: string;
};

export default function InlineLoader({ label }: InlineLoaderProps) {
  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <CircularProgress size={24} />
      <Typography>{label}</Typography>
    </Box>
  );
}