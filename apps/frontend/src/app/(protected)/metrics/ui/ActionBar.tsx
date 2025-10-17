'use client';

import * as React from 'react';
import Box from '@mui/material/Box';

type Props = {
  readonly children?: React.ReactNode;
};

export default function ActionBar({ children }: Props) {
  return (
    <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
      {children}
    </Box>
  );
}