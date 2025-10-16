'use client';

import { Alert } from '@mui/material';

export default function ErrorBanner({ message }: { readonly message: string }) {
  return <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>;
}