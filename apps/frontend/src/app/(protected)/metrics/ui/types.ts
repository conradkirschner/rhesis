export type UiFilterState = {
  readonly search: string;
  readonly backend: readonly string[];
  readonly type: readonly string[];
  readonly scoreType: readonly string[];
};

export type UiFilterOptions = {
  readonly backend: readonly string[];
  readonly type: readonly { value: string; description: string }[];
  readonly scoreType: readonly { value: 'binary' | 'numeric'; label: string }[];
};

export type UiMetricItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly backend?: string;
  readonly metricType?: string;
  readonly scoreType?: string;
  readonly usedIn?: readonly string[];
  readonly type?: 'custom-prompt' | 'api-call' | 'custom-code' | 'grading';
};

export type UiBehaviorRef = {
  readonly id: string;
  readonly name: string;
};

export type UiBehaviorSection = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly metrics: readonly UiMetricItem[];
};