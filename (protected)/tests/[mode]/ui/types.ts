export type UiOption = {
  readonly id: string;
  readonly name: string;
};

export type UiNewTestRow = {
  readonly id: string;
  readonly behaviorId?: string;
  readonly behaviorName: string;
  readonly testType: string;
  readonly topicId?: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly priority: number;
  readonly promptContent: string;
  readonly statusName: string;
};

export type UiStepNewTestsGridProps = {
  readonly rows: readonly UiNewTestRow[];
  readonly behaviorOptions: readonly UiOption[];
  readonly topicOptions: readonly UiOption[];
  readonly onAdd: () => void;
  readonly onSave: () => Promise<void> | void;
  readonly onCancel: () => void;
  readonly onRowUpdate: (row: UiNewTestRow) => UiNewTestRow;
  readonly onRowUpdateError: (error: Error) => void;
  readonly loading?: boolean;
};