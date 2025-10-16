'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';

export default function InlineLoader() {
  return (
    <Stack spacing={1} data-test-id="inline-loader">
      <LinearProgress />
    </Stack>
  );
}