'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import type { UiFeaturePageFrameProps } from './types';

export default function FeaturePageFrame({ title, breadcrumbs, children }: UiFeaturePageFrameProps) {
  return (
    <PageContainer
      title={title}
      breadcrumbs={breadcrumbs.map((b) => ({ title: b.title, path: b.path }))}
    >
      {children}
    </PageContainer>
  );
}