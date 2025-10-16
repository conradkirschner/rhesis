'use client';

import { Alert, AlertTitle, Button, Stack } from '@mui/material';

interface Props {
  readonly message: string;
  readonly onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <Alert severity="error">
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <AlertTitle>Error</AlertTitle>
        {message}
        {onRetry ? (
          <Button variant="outlined" color="inherit" size="small" onClick={onRetry} data-test-id="retry">
            Retry
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}