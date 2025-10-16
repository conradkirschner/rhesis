import { Alert, AlertTitle, Button } from '@mui/material';
import type { UiErrorBannerProps } from './types';

export default function ErrorBanner({
  title = 'Something went wrong',
  message,
  onRetry,
}: UiErrorBannerProps) {
  return (
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
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}