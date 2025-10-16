import * as React from 'react';
import { Box, CircularProgress } from '@mui/material';

type Props = {
  readonly minHeight?: number;
};

export default function InlineLoader({ minHeight = 160 }: Props) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={`${minHeight}px`}>
      <CircularProgress />
    </Box>
  );
}