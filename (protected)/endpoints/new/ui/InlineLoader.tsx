'use client';

import * as React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

type Props = { readonly label?: string };

export default function InlineLoader({ label }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
      <CircularProgress size={20} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}