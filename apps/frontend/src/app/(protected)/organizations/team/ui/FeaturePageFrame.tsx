'use client';

import { PropsWithChildren } from 'react';
import { Paper } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';

export default function FeaturePageFrame({ children }: PropsWithChildren) {
  return (
    <PageContainer>
      <Paper sx={{ p: 3, mb: 4 }}>{children}</Paper>
    </PageContainer>
  );
}