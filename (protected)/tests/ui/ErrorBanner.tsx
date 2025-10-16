'use client';

import * as React from 'react';
import { Alert } from '@mui/material';

export default function ErrorBanner({ message }: { readonly message: string }) {
  return <Alert severity="error">{message}</Alert>;
}