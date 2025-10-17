'use client';

import { Alert } from '@mui/material';

export function ErrorBanner({ message }: { readonly message: string }) {
  return <Alert severity="error" data-test-id="error-banner">{message}</Alert>;
}