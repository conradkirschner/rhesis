'use client';

import * as React from 'react';
import { Box } from '@mui/material';

export default function ActionBar({ children }: { readonly children?: React.ReactNode }) {
  return (
    <Box sx={{ px: 3, pb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
      {children}
    </Box>
  );
}