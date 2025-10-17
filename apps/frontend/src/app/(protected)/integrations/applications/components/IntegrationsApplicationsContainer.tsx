'use client';

import { useCallback } from 'react';
import { useIntegrationsApplicationsData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepEmptyState from '../ui/steps/StepEmptyState';
import type { UiFeaturePageFrameProps } from '../ui/types';

const STEP_COMPONENTS = {
  empty: StepEmptyState,
} as const;

export default function IntegrationsApplicationsContainer() {
  const { step, isLoading, isError, error, refetch } = useIntegrationsApplicationsData();

  const header = {
    title: 'Connect Your Tools',
    subtitle: 'Enhance your workflow by integrating with your favorite services.',
  } satisfies UiFeaturePageFrameProps['header'];

  const handleAdd = useCallback(() => {
    // Intentionally no-op for "Coming soon"
  }, []);

  if (isLoading) {
    return (
      <FeaturePageFrame header={header}>
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  if (isError) {
    return (
      <FeaturePageFrame header={header}>
        <ErrorBanner message={error?.message ?? 'Something went wrong.'} onRetry={refetch} />
      </FeaturePageFrame>
    );
  }

  const Component = STEP_COMPONENTS[step];

  return (
    <FeaturePageFrame header={header}>
      <Component
        badgeLabel="Coming soon"
        title="Add Application"
        description="Connect to your development and productivity tools"
        cta={{
          label: 'Add Application',
          disabled: true,
          onClick: handleAdd,
          'data-test-id': 'add-application',
        }}
      />
    </FeaturePageFrame>
  );
}