'use client';

import { PageContainer } from '@toolpad/core/PageContainer';
import { Box } from '@mui/material';
import type { PropsWithChildren } from 'react';
import type { UiBreadcrumb } from './types';

type Props = PropsWithChildren<{
  readonly title?: string;
  readonly breadcrumbs?: readonly UiBreadcrumb[];
}>;

export default function FeaturePageFrame({ title, breadcrumbs, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs?.map((b) => ({ title: b.title, path: b.path }))}>
      <Box sx={{ pt: 2 }}>{children}</Box>
    </PageContainer>
  );
}