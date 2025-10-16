export type UiScoreType = 'binary' | 'numeric';

export type UiModelOption = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
};

export type UiMetricForm = {
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly evaluation_prompt: string;
  readonly evaluation_steps: readonly string[];
  readonly reasoning: string;
  readonly score_type: UiScoreType;
  readonly min_score?: number;
  readonly max_score?: number;
  readonly threshold?: number;
  readonly explanation: string;
  readonly model_id: string;
};

export type UiBreadcrumb = { readonly title: string; readonly path?: string };