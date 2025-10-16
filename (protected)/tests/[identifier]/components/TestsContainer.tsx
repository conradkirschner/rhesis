'use client';

import * as React from 'react';
import { useTestsData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepOverview from '../ui/steps/StepOverview';
import type { UiCurrentUser, UiActionBarProps, UiStepperHeaderProps, UiStepOverviewProps } from '../ui/types';

interface Props {
  readonly identifier: string;
  readonly currentUser: UiCurrentUser;
}

export default function TestsContainer({ identifier, currentUser }: Props) {
  const { test, isPending, error, refetch } = useTestsData({ identifier });

  const headerProps = {
    title: test?.title ?? 'Test',
    subtitle: `#${identifier}`,
    ownerName: test?.owner?.name ?? '',
    ownerAvatarUrl: test?.owner?.avatarUrl,
  } satisfies UiStepperHeaderProps;

  const actionBarProps = {
    onRefresh: refetch,
    canRefresh: !isPending,
  } satisfies UiActionBarProps;

  if (isPending) {
    return (
      <FeaturePageFrame header={<StepperHeader {...headerProps} />} actions={<ActionBar {...actionBarProps} />}>
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  if (error) {
    return (
      <FeaturePageFrame header={<StepperHeader {...headerProps} />} actions={<ActionBar {...actionBarProps} />}>
        <ErrorBanner message="Failed to load test details." />
      </FeaturePageFrame>
    );
  }

  const stepProps = {
    id: test?.id ?? '',
    title: test?.title ?? '',
    status: test?.status ?? '',
    createdAtISO: test?.createdAtISO ?? null,
    owner: test?.owner ?? null,
    currentUser,
  } satisfies UiStepOverviewProps;

  return (
    <FeaturePageFrame header={<StepperHeader {...headerProps} />} actions={<ActionBar {...actionBarProps} />}>
      <StepOverview {...stepProps} />
    </FeaturePageFrame>
  );
}