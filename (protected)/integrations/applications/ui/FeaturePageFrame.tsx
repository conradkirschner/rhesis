'use client';

import { Box, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import type { UiFeaturePageFrameProps } from './types';

export default function FeaturePageFrame(props: PropsWithChildren<UiFeaturePageFrameProps>) {
  const { header, children } = props;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {header.title}
        </Typography>
        {header.subtitle ? <Typography color="text.secondary">{header.subtitle}</Typography> : null}
      </Box>
      {children}
    </Box>
  );
}