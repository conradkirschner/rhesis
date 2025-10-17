'use client';

import { Stack, Button } from '@mui/material';

type Action = {
  readonly id: string;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: 'text' | 'outlined' | 'contained';
  readonly disabled?: boolean;
};

type Props = {
  readonly primaryActions: readonly Action[];
};

export default function ActionBar({ primaryActions }: Props) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
      {primaryActions.map((a) => (
        <Button
          key={a.id}
          onClick={a.onClick}
          variant={a.variant ?? 'contained'}
          disabled={a.disabled}
          data-test-id={`action-${a.id}`}
        >
          {a.label}
        </Button>
      ))}
    </Stack>
  );
}