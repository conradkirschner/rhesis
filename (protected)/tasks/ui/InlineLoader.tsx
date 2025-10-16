'use client';

import * as React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function InlineLoader({ label = 'Loading…' }: { readonly label?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={16} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}