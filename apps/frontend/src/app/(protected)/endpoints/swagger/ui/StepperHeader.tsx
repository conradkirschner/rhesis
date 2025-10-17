'use client';

import { Box, Typography } from '@mui/material';

type Props = {
  readonly title: string;
};

export default function StepperHeader({ title }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
}