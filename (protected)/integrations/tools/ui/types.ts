import type { ReactNode } from 'react';

export type UiFeaturePageFrameProps = {
  readonly title: string;
  readonly subtitle?: string;
};

export type UiStepperHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
};

export type UiActionBarProps = {
  readonly primaryLabel: string;
  readonly onPrimaryClick: () => void;
  readonly primaryDisabled?: boolean;
};

export type UiIntegrationToolsCardProps = {
  readonly disabled: boolean;
  readonly onAddClick: () => void;
};

export type UiInlineLoaderProps = {
  readonly message?: string;
};

export type UiErrorBannerProps = {
  readonly title?: string;
  readonly message: string;
  readonly onRetry?: () => void;
};