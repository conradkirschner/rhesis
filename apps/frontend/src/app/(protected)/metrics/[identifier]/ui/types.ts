export type UiEditableSectionType = 'general' | 'evaluation' | 'configuration';

export type UiBreadcrumb = {
  title: string;
  path: string;
};

export type UiFeaturePageFrameProps = {
  title: string;
  breadcrumbs: readonly UiBreadcrumb[];
};

export type UiEditableSectionProps = {
  title: string;
  icon: React.ReactNode;
  section: UiEditableSectionType;
  isEditingSection: UiEditableSectionType | null;
  onEdit: (s: UiEditableSectionType) => void;
  onCancel: () => void;
  saving: boolean;
};

export type UiTagEntity = {
  id: string;
  organization_id?: string;
  user_id?: string;
  tags?: readonly { name: string }[];
};

export type UiGeneralSectionProps = {
  isEditing: boolean;
  name: string;
  description: string;
  tags: readonly string[];
  tagEntity: UiTagEntity | null;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onTagsChange: () => void;
};

export type UiModelOption = {
  id: string;
  name: string;
  description?: string | null;
};

export type UiEvaluationSectionProps = {
  isEditing: boolean;
  modelId: string | null;
  models: readonly UiModelOption[];
  onModelChange: (id: string) => void;
  evaluationPrompt: string;
  onEvaluationPromptChange: (v: string) => void;
  steps: readonly string[];
  onStepChange: (index: number, v: string) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  reasoning: string;
  onReasoningChange: (v: string) => void;
};

export type UiConfigurationSectionProps = {
  isEditing: boolean;
  scoreType: 'binary' | 'numeric';
  onScoreTypeChange: (v: 'binary' | 'numeric') => void;
  minScore?: number;
  maxScore?: number;
  threshold?: number;
  onMinScoreChange: (n: number) => void;
  onMaxScoreChange: (n: number) => void;
  onThresholdChange: (n: number) => void;
  explanation: string;
  onExplanationChange: (v: string) => void;
};