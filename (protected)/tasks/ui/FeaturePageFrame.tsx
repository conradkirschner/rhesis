'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';

interface Breadcrumb {
  readonly title: string;
  readonly path: string;
}

interface FeaturePageFrameProps {
  readonly title: string;
  readonly breadcrumbs: readonly Breadcrumb[];
  readonly children?: React.ReactNode;
}

export default function FeaturePageFrame({ title, breadcrumbs, children }: FeaturePageFrameProps) {
  return (
    <PageContainer title={title} breadcrumbs={[...breadcrumbs]}>
      {children}
    </PageContainer>
  );
}