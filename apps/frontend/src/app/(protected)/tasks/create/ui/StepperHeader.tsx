'use client';

import { Box, Typography } from '@mui/material';

type Props = Readonly<{
  title: string;
  subtitle?: string;
}>;

export function StepperHeader({ title, subtitle }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}