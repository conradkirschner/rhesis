'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';

type Crumb = { readonly title: string; readonly path: string };

type Props = {
  readonly title: string;
  readonly breadcrumbs?: readonly Crumb[];
  readonly children: React.ReactNode;
};

export default function FeaturePageFrame({ title, breadcrumbs = [], children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={[...breadcrumbs]}>
      {children}
    </PageContainer>
  );
}