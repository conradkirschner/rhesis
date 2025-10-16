'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import type { UiInlineLoaderProps } from './types';

export function InlineLoader({ label }: UiInlineLoaderProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {label ? <Typography variant="body1">{label}</Typography> : null}
      <CircularProgress />
    </Box>
  );
}