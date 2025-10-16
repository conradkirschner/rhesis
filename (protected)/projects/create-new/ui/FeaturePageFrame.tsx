'use client';

import * as React from 'react';
import { Container, Paper, Typography, useTheme } from '@mui/material';
import type { UiFeaturePageFrameProps } from './types';

export default function FeaturePageFrame(props: UiFeaturePageFrameProps) {
  const theme = useTheme();
  return (
    <Container maxWidth="lg" sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          pt: 2,
          pb: 3,
          px: 3,
          borderRadius: theme.shape.borderRadius,
          width: '100%',
          maxWidth: 800,
          minWidth: 800,
        }}
      >
        <Typography variant="h4" align="center" sx={{ mb: 3 }}>
          {props.title}
        </Typography>
        {props.children}
      </Paper>
    </Container>
  );
}