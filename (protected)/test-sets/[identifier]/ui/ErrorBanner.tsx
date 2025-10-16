'use client';

import * as React from 'react';
import { Alert, Box, Button } from '@mui/material';
import type { UiErrorBannerProps } from './types';

export default function ErrorBanner({ message, onRetry }: UiErrorBannerProps) {
  if (!message) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry} data-test-id="retry">
              Retry
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Box>
  );
}