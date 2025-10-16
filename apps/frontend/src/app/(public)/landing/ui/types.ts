import type { ReactNode } from 'react';

export type AuthProvider =
  | 'email'
  | 'google-oauth2'
  | 'github'
  | 'apple'
  | 'windowslive';

export interface UiFeaturePageFrameProps {
  readonly right: ReactNode;
  readonly userName?: string;
}

export interface UiLoginSectionProps {
  readonly termsAccepted: boolean;
  readonly previouslyAccepted: boolean;
  readonly showTermsWarning: boolean;
  readonly onToggleTerms: (accepted: boolean) => void;
  readonly onLogin: (provider: AuthProvider) => void;
}

export interface UiInlineLoaderProps {
  readonly label?: string;
}

export interface UiErrorBannerProps {
  readonly message: string;
}