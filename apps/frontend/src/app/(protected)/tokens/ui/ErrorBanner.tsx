'use client';

import { Alert } from '@mui/material';

type Props = { message: string };

export default function ErrorBanner({ message }: Props) {
  return (
    <Alert severity="error" sx={{ mb: 2 }} data-test-id="error-banner">
      {message}
    </Alert>
  );
}