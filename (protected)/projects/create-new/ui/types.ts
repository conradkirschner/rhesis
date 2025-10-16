export type UiFeaturePageFrameProps = Readonly<{
  title: string;
  children: React.ReactNode;
}>;

export type UiStepperHeaderProps = Readonly<{
  steps: readonly string[];
  activeStep: number;
}>;

export type UiActionBarProps = Readonly<{
  onCancel: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isBusy?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}>;

export type UiOwnerOption = Readonly<{
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}>;

export type UiProjectDetailsForm = Readonly<{
  projectName: string;
  description: string;
  icon: string;
  ownerId: string;
}>;

export type UiProjectDetailsStepProps = Readonly<{
  owners: readonly UiOwnerOption[];
  form: UiProjectDetailsForm;
  onFormChange: (patch: Partial<UiProjectDetailsForm>) => void;
}>;

export type UiFinishStepProps = Readonly<{
  form: Readonly<{
    projectName: string;
    description: string;
    icon: string;
  }>;
  owner?: Readonly<{
    name: string;
    picture?: string;
  }>;
  isOwnerLoading?: boolean;
}>;

export type UiInlineLoaderProps = Readonly<{
  label?: string;
}>;

export type UiErrorBannerProps = Readonly<{
  message: string | null;
  onClose: () => void;
}>;