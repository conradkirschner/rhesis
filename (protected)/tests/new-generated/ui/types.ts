export type UiStepLabels = readonly [string, string, string, string];
export type UiStepKey = 0 | 1 | 2 | 3;

export type UiProjectOption = { readonly id: string; readonly name: string };
export type UiBehaviorOption = { readonly id: string; readonly name: string };

export type UiTestSetGenerationConfig = {
  readonly project_name: string | null;
  readonly behaviors: readonly string[];
  readonly purposes: readonly string[];
  readonly test_type: 'single_turn' | 'multi_turn';
  readonly response_generation: 'prompt_only' | 'prompt_and_response';
  readonly test_coverage: 'focused' | 'standard' | 'comprehensive';
  readonly tags: readonly string[];
  readonly description: string;
};

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

export type UiConfigureGenerationProps = {
  readonly projects: readonly UiProjectOption[];
  readonly behaviors: readonly UiBehaviorOption[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly configData: UiTestSetGenerationConfig;
  readonly onConfigChange: (cfg: UiTestSetGenerationConfig) => void;
  readonly onSubmit: (cfg: UiTestSetGenerationConfig) => void;
  readonly supportedExtensions: readonly string[];
  readonly toPromptPreview: () => unknown;
};

export type UiUploadDocumentsProps = {
  readonly documents: readonly UiDocument[];
  readonly onFilesSelected: (files: FileList | null) => void;
  readonly onDocumentUpdate: (id: string, field: 'name' | 'description', value: string) => void;
  readonly onDocumentRemove: (id: string) => void;
};

export type UiReviewSamplesProps = {
  readonly samples: readonly UiSample[];
  readonly isGenerating: boolean;
  readonly onSamplesChange: (samples: UiSample[]) => void;
  readonly onLoadMore: () => void;
  readonly onRegenerate: (sampleId: number) => void;
};

export type UiConfirmGenerateProps = {
  readonly samples: readonly UiSample[];
  readonly configData: UiTestSetGenerationConfig;
  readonly documents: readonly UiDocument[];
  readonly averageRating: string;
  readonly promptPreview: unknown;
  readonly docsPayload: readonly { name: string; description: string; content: string }[];
  readonly onFilesSelected?: (files: FileList | null) => void;
  readonly onDocumentUpdate?: (id: string, field: 'name' | 'description', value: string) => void;
  readonly onDocumentRemove?: (id: string) => void;
};