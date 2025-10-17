export interface UiCurrentUser {
  readonly id: string;
  readonly name: string;
  readonly picture?: string;
}

export type UiStepLabels = readonly [string, string, string, string];
export type UiStepKey = 0 | 1 | 2 | 3;

export type UiProjectOption = { readonly id: string; readonly name: string };
export interface UiStepOverviewProps {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly createdAtISO: string | null;
  readonly owner: { readonly id: string; readonly name: string; readonly avatarUrl?: string } | null;
  readonly currentUser: UiCurrentUser;
}
export type UiDocument = {
  readonly id: string;
  readonly originalName: string;
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly content: string;
  readonly status: 'uploading' | 'extracting' | 'generating' | 'completed' | 'error';
};

export type UiSample = {
  readonly id: number;
  readonly text: string;
  readonly behavior: string;
  readonly topic: string;
  readonly rating: number | null;
  readonly feedback: string;
};

export type UiStepperHeaderProps = {
  readonly activeStep: UiStepKey;
  readonly labels: UiStepLabels;
};

export type UiActionBarProps = {
  readonly activeStep: UiStepKey;
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onFinish: () => void;
  readonly isGenerating: boolean;
  readonly isFinishing: boolean;
  readonly nextDisabled?: boolean;
};

export type UiUploadDocumentsProps = {
  readonly documents: readonly UiDocument[];
  readonly onFilesSelected: (files: FileList | null) => void;
  readonly onDocumentUpdate: (id: string, field: 'name' | 'description', value: string) => void;
  readonly onDocumentRemove: (id: string) => void;
};
