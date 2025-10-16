'use client';

import { Box, Typography } from '@mui/material';

type Props = {
  readonly headline: string;
  readonly blurb?: string;
};

export default function StepOverview({ headline, blurb }: Props) {
  return (
    <Box>
      <Typography variant="h6">{headline}</Typography>
      {blurb ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {blurb}
        </Typography>
      ) : null}
    </Box>
  );
}