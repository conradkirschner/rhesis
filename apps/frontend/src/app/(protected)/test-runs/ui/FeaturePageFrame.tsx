'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import Box from '@mui/material/Box';
import type { UiBreadcrumb } from './types';

type Props = {
  title: string;
  breadcrumbs: readonly UiBreadcrumb[];
  children?: React.ReactNode;
};

export default function FeaturePageFrame({ title, breadcrumbs, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs as any}>
      <Box sx={{ p: 2 }}>{children}</Box>
    </PageContainer>
  );
}