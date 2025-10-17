'use client';

import { Alert, Button, Stack } from '@mui/material';

type Props = {
  readonly message: string;
  readonly onRetry: () => void;
};

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <Stack spacing={2}>
      <Alert severity="error">{message}</Alert>
      <Button variant="outlined" onClick={onRetry} data-test-id="retry">
        Retry
      </Button>
    </Stack>
  );
}