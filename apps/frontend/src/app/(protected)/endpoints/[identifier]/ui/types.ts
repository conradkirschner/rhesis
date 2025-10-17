export type UiBreadcrumb = {
  readonly title: string;
  readonly path?: string;
};

export type StepKey = 'basic' | 'request' | 'response' | 'test';

export type UiProjectOption = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly iconKey: string | null;
};

export type UiEndpointBasic = {
  readonly name: string | null;
  readonly description: string | null;
  readonly url: string | null;
  readonly protocol: string | null;
  readonly method: string | null;
  readonly environment: string | null;
  readonly projectId: string | null;
};

export type FeaturePageFrameProps = {
  readonly title: string;
  readonly breadcrumbs: readonly UiBreadcrumb[];
  readonly header: React.ReactNode;
  readonly actionBar: React.ReactNode;
  readonly children: React.ReactNode;
};

export type StepperHeaderProps = {
  readonly step: StepKey;
  readonly steps: readonly StepKey[];
  readonly onStepChange: (s: StepKey) => void;
};

export type ActionBarProps = {
  readonly isEditing: boolean;
  readonly isSaving: boolean;
  readonly onEdit: () => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
};

export type StepBasicInformationProps = {
  readonly isEditing: boolean;
  readonly values: UiEndpointBasic;
  readonly projects: readonly UiProjectOption[];
  readonly onChange: (patch: Partial<UiEndpointBasic>) => void;
};

export type StepRequestSettingsProps = {
  readonly isEditing: boolean;
  readonly requestHeaders: string;
  readonly requestBodyTemplate: string;
  readonly onChange: (patch: Partial<{
    requestHeaders: string;
    requestBodyTemplate: string;
  }>) => void;
};

export type StepResponseSettingsProps = {
  readonly isEditing: boolean;
  readonly responseMappings: string;
  readonly onChange: (patch: Partial<{
    responseMappings: string;
  }>) => void;
};

export type StepTestConnectionProps = {
  readonly testInput: string;
  readonly onChange: (value: string) => void;
  readonly onTest: () => void;
  readonly testResponse: string;
  readonly isTesting: boolean;
};