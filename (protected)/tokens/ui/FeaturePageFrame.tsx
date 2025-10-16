'use client';

import { Box } from '@mui/material';
import { PropsWithChildren } from 'react';

export default function FeaturePageFrame({ children }: PropsWithChildren) {
  return (
    <Box sx={{ p: 3 }}>
      {children}
    </Box>
  );
}