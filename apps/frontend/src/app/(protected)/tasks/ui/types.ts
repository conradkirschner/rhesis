export interface UiPagination {
  readonly page: number;
  readonly pageSize: number;
}

export interface UiTaskRow {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly statusName: string | null;
  readonly assigneeName: string | null;
  readonly assigneePicture: string | null;
}

export interface UiDeleteDialogState {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly isLoading: boolean;
  readonly count: number;
}

export interface UiTasksGridProps {
  readonly rows: readonly UiTaskRow[];
  readonly totalRows: number;
  readonly pagination: UiPagination;
  readonly onPaginationChange: (next: UiPagination) => void;
  readonly onRowClick: (id: string) => void;
  readonly selectedRowIds: readonly string[];
  readonly onSelectedRowIdsChange: (ids: readonly string[]) => void;
  readonly onCreateClick: () => void;
  readonly onDeleteSelectedClick?: () => void;
  readonly onFilterChange: (odataFilter: string | undefined) => void;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly error?: string;
  readonly deleteDialog: UiDeleteDialogState;
}

export interface UiTasksStatsProps {
  readonly total: number;
  readonly open: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly cancelled: number;
  readonly loading: boolean;
  readonly updating: boolean;
  readonly errorMessage?: string;
}
export type UiTaskListItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly statusName: string | null;
  readonly assigneeName: string | null;
  readonly assigneeAvatar: string | null;
};

export type UiTaskStats = {
  readonly total: number;
  readonly open: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly cancelled: number;
};

export type UiActionBarProps = {
  readonly canDelete: boolean;
  readonly deleteLabelCount: number;
  readonly onCreate: () => void;
  readonly onDelete: () => void;
  readonly onSearchChange: (value: string) => void;
};