'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  readonly label?: string;
}

export default function InlineLoader({ label }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
      <CircularProgress size={24} />
      {label ? <Typography variant="body2">{label}</Typography> : null}
    </Box>
  );
}