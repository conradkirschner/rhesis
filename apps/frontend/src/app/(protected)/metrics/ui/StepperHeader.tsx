'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
};

export default function StepperHeader({ title, subtitle }: Props) {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}