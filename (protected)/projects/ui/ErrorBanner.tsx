'use client';

import { Alert, Button, Stack } from '@mui/material';

type Props = {
  readonly message: string;
  readonly onRetry?: () => void;
};

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <Stack sx={{ my: 2 }} spacing={2}>
      <Alert severity="error">{message}</Alert>
      {onRetry ? (
        <Button variant="outlined" onClick={onRetry} data-test-id="retry-btn">
          Retry
        </Button>
      ) : null}
    </Stack>
  );
}