'use client';

import * as React from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

interface Props {
  readonly header: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
}

export default function FeaturePageFrame({ header, actions, children }: Props) {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
          {header}
        </Paper>
        {actions ? (
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
            {actions}
          </Paper>
        ) : null}
        <Box component={Paper} elevation={0} sx={{ p: 2, borderRadius: 3 }}>
          {children}
        </Box>
      </Stack>
    </Container>
  );
}