'use client';

import { Box, Button } from '@mui/material';

type Props = {
  readonly primaryLabel: string;
  readonly onPrimary: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export default function ActionBar({ primaryLabel, onPrimary, ...divProps }: Props) {
  return (
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }} {...divProps}>
      <Button
        variant="contained"
        onClick={onPrimary}
        data-test-id="action-primary"
      >
        {primaryLabel}
      </Button>
    </Box>
  );
}