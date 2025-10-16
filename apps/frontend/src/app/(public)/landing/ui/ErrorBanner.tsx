'use client';

import { Alert } from '@mui/material';
import type { UiErrorBannerProps } from './types';

export function ErrorBanner({ message }: UiErrorBannerProps) {
  return <Alert severity="error" data-test-id="error-banner">{message}</Alert>;
}