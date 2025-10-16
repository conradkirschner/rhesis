export type UiOnboardingForm = {
  firstName: string;
  lastName: string;
  organizationName: string;
  website: string;
  invites: readonly { email: string }[];
};

export type UiOnboardingStatus =
  | 'idle'
  | 'creating_organization'
  | 'updating_user'
  | 'loading_initial_data'
  | 'completed';

export type UiFeaturePageFrameProps = {
  title: string;
  subtitle?: string;
  steps: readonly string[];
  activeStep: number;
  children?: React.ReactNode;
};

export type UiStepperHeaderProps = {
  title: string;
  description?: string;
  subtitle?: string;
};

export type UiActionBarProps = {
  showBack?: boolean;
  primaryLabel?: string;
  primaryAction?: 'next' | 'complete';
  isBusy?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
};

export type UiStepOrganizationDetailsProps = {
  formData: UiOnboardingForm;
  onChange: (patch: Partial<UiOnboardingForm>) => void;
};

export type UiStepInviteTeamProps = {
  formData: Pick<UiOnboardingForm, 'invites'>;
  onChange: (patch: Partial<Pick<UiOnboardingForm, 'invites'>>) => void;
};

export type UiStepFinishProps = {
  formData: UiOnboardingForm;
  status: UiOnboardingStatus;
};