'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import type { UiActionButton } from './types';

type Props = {
  buttons: readonly UiActionButton[];
};

export default function ActionBar({ buttons }: Props) {
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
      {buttons.map((b, idx) => (
        <Button
          key={`${b.label}-${idx}`}
          variant={b.variant}
          color={b.color}
          startIcon={b.icon}
          onClick={b.onClick}
          data-test-id={`action-${b.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {b.label}
        </Button>
      ))}
    </Stack>
  );
}