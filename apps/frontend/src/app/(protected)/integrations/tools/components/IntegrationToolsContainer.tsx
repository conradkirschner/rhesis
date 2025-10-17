'use client';

import { useCallback } from 'react';
import { useIntegrationToolsData } from '@/hooks/data';
import type {
  UiFeaturePageFrameProps,
  UiIntegrationToolsCardProps,
} from '../ui/types';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import IntegrationToolsCard from '../ui/IntegrationToolsCard';

export default function IntegrationToolsContainer() {
  const data = useIntegrationToolsData();

  const handleAdd = useCallback(() => {
    // Side-effect owned by the container; replace with navigation or toast later.
    // eslint-disable-next-line no-console -- intentional developer log
    console.log('Add Tool clicked');
  }, []);

  const frameProps = {
    title: 'Development Tools',
    subtitle:
      'Connect your monitoring, logging, and analytics tools to enhance your development workflow.',
  } satisfies Partial<UiFeaturePageFrameProps>;

  const cardProps = {
    disabled: !data.isAddAvailable,
    onAddClick: handleAdd,
  } satisfies UiIntegrationToolsCardProps;

  return (
    <FeaturePageFrame {...frameProps}>
      <IntegrationToolsCard {...cardProps} />
    </FeaturePageFrame>
  );
}