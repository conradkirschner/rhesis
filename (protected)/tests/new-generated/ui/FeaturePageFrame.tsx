'use client';

import { Container, Box } from '@mui/material';
import type { PropsWithChildren } from 'react';

export function FeaturePageFrame({ children }: PropsWithChildren) {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }} data-test-id="feature-page-frame">
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</Box>
    </Container>
  );
}