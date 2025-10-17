import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

type Props = { readonly label?: string };

export default function InlineLoader({ label = 'Loading...' }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <CircularProgress size={20} />
      <Typography>{label}</Typography>
    </Box>
  );
}