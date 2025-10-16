'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import type { PropsWithChildren } from 'react';
import StepperHeader from './StepperHeader';

type Breadcrumb = { title: string; path?: string };

type Props = PropsWithChildren<{
  readonly title: string;
  readonly breadcrumbs: readonly Breadcrumb[];
}>;

export default function FeaturePageFrame({ title, breadcrumbs, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={breadcrumbs}>
      <StepperHeader title={title} />
      {children}
    </PageContainer>
  );
}