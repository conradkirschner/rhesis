'use client';

import * as React from 'react';
import { Alert } from '@mui/material';

type Props = {
  readonly error: string | null;
};

export default function ErrorBanner({ error }: Props) {
  if (!error) return null;
  return <Alert severity="error">{error}</Alert>;
}