export type UiTestRow = {
  readonly id: string;
  readonly content: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly assigneeDisplay: string;
  readonly assigneePicture?: string;
  readonly comments: number;
  readonly tasks: number;
};

export type UiPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type UiCreateTestFormData = {
  readonly statusId: string;
  readonly assigneeId?: string;
  readonly ownerId?: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly priorityLevel: UiPriority;
  readonly promptContent: string;
};

export type UiLookupOption = { readonly id: string; readonly name: string };
export type UiUserOption = { readonly id: string; readonly displayName: string; readonly picture?: string };
export type UiStatusOption = { readonly id: string; readonly name: string };

export type UiLookupSets = {
  readonly behaviors: readonly UiLookupOption[];
  readonly topics: readonly UiLookupOption[];
  readonly categories: readonly UiLookupOption[];
  readonly users: readonly UiUserOption[];
  readonly statuses: readonly UiStatusOption[];
};

/** Aliases used by grid/UI layers */
export type UiOption = UiLookupOption;

/** Test type options used across UI (strict, no `string`) */
export type UiTestType = 'Single interaction tests' | 'Multi-turn conversation tests';

/** Row model used by the “New Tests” editable grid */
export type UiNewTestRow = {
  readonly id: string;
  readonly behaviorId?: string;
  readonly behaviorName?: string;
  readonly topicId?: string;
  readonly topicName?: string;
  readonly testType: UiTestType;
  readonly categoryName: string;
  readonly promptContent: string;
  /** Numeric priority rank (higher = more important). UI maps to labels where needed. */
  readonly priority: number;
  readonly statusName: string;
};

/** Props for StepNewTestsGrid (kept framework-agnostic & strictly typed) */
export type UiStepNewTestsGridProps = {
  readonly rows: readonly UiNewTestRow[];
  readonly behaviorOptions: readonly UiOption[];
  readonly topicOptions: readonly UiOption[];
  readonly onRowUpdate: (
      newRow: UiNewTestRow,
      oldRow: UiNewTestRow
  ) => UiNewTestRow | Promise<UiNewTestRow>;
  readonly onRowUpdateError: (error: Error) => void;
  readonly loading?: boolean;
};
