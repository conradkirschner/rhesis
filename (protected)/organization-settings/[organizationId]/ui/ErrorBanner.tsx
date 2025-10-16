'use client';

import { Alert } from '@mui/material';

type Props = {
  message: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
};

export default function ErrorBanner({ message, severity = 'error' }: Props) {
  return <Alert severity={severity} sx={{ mb: 3 }}>{message}</Alert>;
}