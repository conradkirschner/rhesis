'use client';

import { Box, Button } from '@mui/material';

type Props = Readonly<{
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  disabled?: boolean;
}>;

export function ActionBar({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  disabled,
}: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
      {secondaryLabel ? (
        <Button
          variant="outlined"
          onClick={onSecondary}
          disabled={disabled}
          data-test-id="action-secondary"
        >
          {secondaryLabel}
        </Button>
      ) : null}
      <Button
        variant="contained"
        onClick={onPrimary}
        disabled={disabled}
        data-test-id="action-primary"
      >
        {primaryLabel}
      </Button>
    </Box>
  );
}