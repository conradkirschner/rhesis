'use client';

import * as React from 'react';
import { Box, Button } from '@mui/material';

export type UiAction = {
  readonly label: string;
  readonly variant?: 'text' | 'outlined' | 'contained';
  readonly color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly ['data-test-id']?: string;
};

type Props = {
  readonly actions: readonly UiAction[];
};

export default function ActionBar({ actions }: Props) {
  if (actions.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      {actions.map((a) => (
        <Button
          key={a.label}
          variant={a.variant ?? 'contained'}
          color={a.color}
          disabled={a.disabled}
          onClick={a.onClick}
          data-test-id={a['data-test-id']}
        >
          {a.label}
        </Button>
      ))}
    </Box>
  );
}