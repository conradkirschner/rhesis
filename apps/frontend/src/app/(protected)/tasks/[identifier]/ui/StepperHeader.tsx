'use client';

import { Box, Typography } from '@mui/material';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
};

export default function StepperHeader({ title, subtitle }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}