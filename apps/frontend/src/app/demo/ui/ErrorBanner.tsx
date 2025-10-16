import { Alert } from '@mui/material';
import type { UiErrorBannerProps } from './types';

export default function ErrorBanner({ message, 'data-test-id': dataTestId }: UiErrorBannerProps) {
  return <Alert severity="error" data-test-id={dataTestId ?? 'error-banner'}>{message}</Alert>;
}