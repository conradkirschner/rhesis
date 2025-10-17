export type UiTestSetRow = {
  readonly id: string;
  readonly name: string;
  readonly behaviors: readonly string[];
  readonly categories: readonly string[];
  readonly totalTests: number;
  readonly status: string;
  readonly assigneeDisplay?: string;
  readonly assigneeAvatarUrl?: string;
  readonly comments?: number;
  readonly tasks?: number;
};

export type UiStepListProps = {
  readonly rows: readonly UiTestSetRow[];
  readonly totalRows: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
  readonly selectedIds: readonly string[];
  readonly onSelectionChange: (ids: readonly string[]) => void;
  readonly onRowClick: (id: string) => void;
  readonly loading: boolean;
  readonly onNew: () => void;
  readonly onRun: () => void;
  readonly onDelete: () => void;
};

export type UiAction = {
  readonly label: string;
  readonly variant?: 'text' | 'outlined' | 'contained';
  readonly color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly ['data-test-id']?: string;
};