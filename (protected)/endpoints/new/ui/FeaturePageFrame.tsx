'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core';

type Crumb = { title: string; path?: string };
type Props = {
  readonly title: string;
  readonly breadcrumbs: readonly Crumb[];
  readonly children: React.ReactNode;
};

export default function FeaturePageFrame({ title, breadcrumbs, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs as { title: string; path?: string }[]}>
      {children}
    </PageContainer>
  );
}