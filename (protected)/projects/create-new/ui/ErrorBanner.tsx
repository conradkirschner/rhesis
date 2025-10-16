'use client';

import * as React from 'react';
import { Alert, Snackbar } from '@mui/material';
import type { UiErrorBannerProps } from './types';

export default function ErrorBanner({ message, onClose }: UiErrorBannerProps) {
  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="error" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}