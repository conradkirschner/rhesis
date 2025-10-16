'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

type Props = { readonly message?: string };

export default function InlineLoader({ message = 'Loading...' }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 200 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography>{message}</Typography>
      </Box>
    </Box>
  );
}