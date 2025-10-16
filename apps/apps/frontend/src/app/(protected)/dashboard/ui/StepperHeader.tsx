'use client';

import { Box, Typography } from '@mui/material';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
};

export default function StepperHeader({ title, subtitle }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}