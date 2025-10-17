'use client';

import { Box, Button } from '@mui/material';

type Props = {
  readonly primaryLabel: string;
  readonly onPrimary: () => void;
  readonly secondaryLabel?: string;
  readonly onSecondary?: () => void;
};

export default function ActionBar({ primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
      {secondaryLabel && onSecondary ? (
        <Button variant="text" onClick={onSecondary} data-test-id="secondary-action-btn">
          {secondaryLabel}
        </Button>
      ) : null}
      <Button variant="contained" onClick={onPrimary} data-test-id="primary-action-btn">
        {primaryLabel}
      </Button>
    </Box>
  );
}