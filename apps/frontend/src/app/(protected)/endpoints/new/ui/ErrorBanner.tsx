'use client';

import * as React from 'react';
import { Alert } from '@mui/material';

type Props = { readonly message: string };

export default function ErrorBanner({ message }: Props) {
  return <Alert severity="error">{message}</Alert>;
}