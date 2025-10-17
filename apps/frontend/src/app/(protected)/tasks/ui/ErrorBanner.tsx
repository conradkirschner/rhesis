'use client';

import * as React from 'react';
import { Alert, Button } from '@mui/material';

interface ErrorBannerProps {
  readonly message: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
}

export default function ErrorBanner({ message, onRetry, retryLabel = 'Retry' }: ErrorBannerProps) {
  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}