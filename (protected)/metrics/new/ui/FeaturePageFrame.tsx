import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import Box from '@mui/material/Box';
import type { UiBreadcrumb } from './types';

type Props = {
  readonly title: string;
  readonly breadcrumbs: readonly UiBreadcrumb[];
  readonly children: React.ReactNode;
};

export default function FeaturePageFrame({ title, breadcrumbs, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs as any} sx={{ mb: 4 }}>
      <Box sx={{ width: '100%' }}>{children}</Box>
    </PageContainer>
  );
}