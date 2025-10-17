'use client';

import { Paper, Typography } from '@mui/material';

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: (t) => t.palette.error.light,
        color: (t) => t.palette.error.contrastText,
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Paper>
  );
}