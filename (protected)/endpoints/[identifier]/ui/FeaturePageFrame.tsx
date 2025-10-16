'use client';

import { Box } from '@mui/material';
import { PageContainer } from '@toolpad/core';
import type { FeaturePageFrameProps } from './types';

export default function FeaturePageFrame({
  title,
  breadcrumbs,
  header,
  actionBar,
  children,
}: FeaturePageFrameProps) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        {header}
        {actionBar}
      </Box>
      <Box sx={{ flexGrow: 1, pt: 2 }}>{children}</Box>
    </PageContainer>
  );
}