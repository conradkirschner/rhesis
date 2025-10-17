'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export interface UiActionBarProps {
  readonly onRefresh: () => void;
  readonly canRefresh: boolean;
}

export default function ActionBar({ onRefresh, canRefresh }: UiActionBarProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" data-test-id="action-bar">
      <Button variant="outlined" onClick={onRefresh} disabled={!canRefresh} data-test-id="refresh-button">
        Refresh
      </Button>
    </Stack>
  );
}