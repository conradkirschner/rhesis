'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type Props = { readonly message: string };

export default function ErrorBanner({ message }: Props) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">{message}</Typography>
    </Box>
  );
}