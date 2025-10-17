'use client';

import { Alert } from '@mui/material';

export interface ErrorBannerProps {
  readonly message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return <Alert severity="error">{message}</Alert>;
}