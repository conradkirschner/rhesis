'use client';

import * as React from 'react';
import { Box } from '@mui/material';

export default function ActionBar({ children }: { children?: React.ReactNode }) {
  return (
    <Box
      sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', my: 2 }}
      data-test-id="action-bar"
    >
      {children}
    </Box>
  );
}