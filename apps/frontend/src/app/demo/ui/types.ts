import type { ReactNode } from 'react';

export type UiDemoFrameProps = {
  readonly showBackground: boolean;
  readonly children: ReactNode;
};

export type UiStepperHeaderProps = {
  readonly logoSrc: string;
  readonly logoAlt: string;
};

export type UiActionBarProps = {
  readonly primaryLabel: string;
  readonly onPrimary: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly 'data-test-id'?: string;
};

export type UiStepCredentialsProps = {
  readonly email: string;
  readonly password: string;
  readonly onContinue: () => void;
};

export type UiErrorBannerProps = {
  readonly message: string;
  readonly 'data-test-id'?: string;
};