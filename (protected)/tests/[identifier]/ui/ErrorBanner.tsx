'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';

interface Props {
  readonly message: string;
}

export default function ErrorBanner({ message }: Props) {
  return <Alert severity="error" data-test-id="error-banner">{message}</Alert>;
}