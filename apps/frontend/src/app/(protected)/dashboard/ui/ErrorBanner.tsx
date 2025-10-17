'use client';

import * as React from 'react';
import { Alert } from '@mui/material';

export default function ErrorBanner(props: { message: string; severity?: 'error' | 'warning' }) {
  const { message, severity = 'error' } = props;
  return (
    <Alert sx={{ mb: 2 }} severity={severity} data-test-id="error-banner">
      {message}
    </Alert>
  );
}