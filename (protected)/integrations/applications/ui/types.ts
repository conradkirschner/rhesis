import type { ReactNode } from 'react';

export type UiPageHeader = {
  readonly title: string;
  readonly subtitle?: string;
};

export type UiFeaturePageFrameProps = {
  readonly header: UiPageHeader;
  readonly children?: ReactNode;
};

export type UiStepperHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
};

export type UiAction = {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly 'data-test-id': string;
};

export type UiActionBarProps = {
  readonly primary?: UiAction;
};

export type UiEmptyStateCardProps = {
  readonly badgeLabel: string;
  readonly title: string;
  readonly description: string;
  readonly cta: UiAction;
};