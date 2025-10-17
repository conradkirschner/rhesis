'use client';

import { Box } from '@mui/material';

type Props = {
  children?: React.ReactNode;
};

export default function ActionBar({ children }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
      {children}
    </Box>
  );
}