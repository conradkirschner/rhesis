'use client';

import { Box } from '@mui/material';

type Props = {
  readonly children?: React.ReactNode;
};

export default function ActionBar({ children }: Props) {
  return (
    <Box sx={{ mt: 2, display: 'flex', gap: 1 }} data-test-id="action-bar">
      {children}
    </Box>
  );
}