'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { PropsWithChildren } from 'react';

export default function FeaturePageFrame({ children }: PropsWithChildren) {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper elevation={0} sx={{ p: 2 }}>{children}</Paper>
    </Box>
  );
}