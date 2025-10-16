'use client';

import * as React from 'react';
import { Alert } from '@mui/material';

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
}