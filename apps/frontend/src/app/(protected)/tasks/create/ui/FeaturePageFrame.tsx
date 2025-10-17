'use client';

import { PropsWithChildren } from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import { Box, Paper } from '@mui/material';

type Crumb = Readonly<{ title: string; path: string }>;

type Props = Readonly<
  PropsWithChildren<{
    title: string;
    breadcrumbs: readonly Crumb[];
  }>
>;

export function FeaturePageFrame({ title, breadcrumbs, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs as Crumb[]}>
      <Box sx={{ flexGrow: 1, pt: 3 }}>
        <Paper sx={{ p: 3 }}>{children}</Paper>
      </Box>
    </PageContainer>
  );
}