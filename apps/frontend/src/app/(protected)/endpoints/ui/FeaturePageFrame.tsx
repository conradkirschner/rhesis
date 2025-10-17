'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';

export interface FeaturePageFrameProps {
  readonly title: string;
  readonly breadcrumbs: readonly { title: string; href?: string }[];
  readonly children: React.ReactNode;
}

export default function FeaturePageFrame(props: FeaturePageFrameProps) {
  const { title, breadcrumbs, children } = props;
  return (
    <PageContainer title={title} breadcrumbs={[...breadcrumbs]}>
      {children}
    </PageContainer>
  );
}