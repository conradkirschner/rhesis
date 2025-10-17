'use client';

import { Box, Button, CircularProgress, Typography } from '@mui/material';

type Props = {
  readonly title?: string;
  readonly onBack?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export default function InlineLoader({ title = 'Loading…', onBack, ...divProps }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        gap: 3,
      }}
      {...divProps}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {onBack ? (
        <Button variant="outlined" onClick={onBack} data-test-id="loader-back">
          Back
        </Button>
      ) : null}
    </Box>
  );
}