'use client';

import { Box, Button, CircularProgress } from '@mui/material';

type Props = {
  readonly label: string;
  readonly onClick: () => void;
  readonly loading?: boolean;
  readonly 'data-test-id'?: string;
};

export default function ActionBar({ label, onClick, loading, 'data-test-id': testId }: Props) {
  return (
    <Box display="flex" justifyContent="flex-end">
      <Button
        data-test-id={testId ?? 'action-bar-button'}
        onClick={onClick}
        variant="contained"
        disabled={Boolean(loading)}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {loading ? 'Working…' : label}
      </Button>
    </Box>
  );
}