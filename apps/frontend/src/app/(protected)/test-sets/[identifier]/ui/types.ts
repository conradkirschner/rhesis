import type { EntityStats } from '@/api-client/types.gen';

export type UiBreadcrumb = { readonly title: string; readonly path: string };

export type UiFeaturePageFrameProps = {
  readonly title: string;
  readonly breadcrumbs: readonly UiBreadcrumb[];
  readonly children: React.ReactNode;
};

export type UiStepperHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
};

export type UiActionBarProps = {
  readonly onExecute: () => void;
  readonly onDownload: () => void;
};

export type UiInlineLoaderProps = {
  readonly show: boolean;
};

export type UiErrorBannerProps = {
  readonly message: string | null;
  readonly onRetry?: () => void;
};

export type UiChartsProps = {
  readonly stats: EntityStats | null;
};

export type UiTestSetDetailsProps = {
  readonly name: string;
  readonly description: string;
  readonly metadata: {
    readonly behaviors: readonly string[];
    readonly categories: readonly string[];
    readonly topics: readonly string[];
    readonly sources: readonly { name?: string; document?: string; description?: string }[];
  };
  readonly tags: readonly string[];
  readonly updating?: boolean;
  readonly onEditName: (name: string) => void;
  readonly onEditDescription: (description: string) => void;
  readonly onDownload: () => void;
};

export type UiTestsGridRow = {
  readonly id: string;
  readonly promptContent: string;
  readonly behaviorName?: string;
  readonly topicName?: string;
};

export type UiTestsGridProps = {
  readonly rows: readonly UiTestsGridRow[];
  readonly totalRows: number;
  readonly loading: boolean;
  readonly pagination: { readonly page: number; readonly pageSize: number };
  readonly onPaginationChange: (next: { page: number; pageSize: number }) => void;
  readonly onRowClick: (id: string) => void;
  readonly onRemoveSelected: (ids: readonly string[]) => void;
  readonly error: string | null;
  readonly onRefetch: () => void;
};

export type UiExecuteDrawerProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly projects: readonly { id: string; name: string }[];
  readonly endpoints: readonly { id: string; name: string; environment?: string; project_id?: string }[];
  readonly filterEndpointsByProject: (projectId: string | null) => readonly {
    id: string;
    name: string;
    environment?: string;
    project_id?: string;
  }[];
  readonly onExecute: (payload: { endpointId: string; executionMode: 'Parallel' | 'Sequential' }) => void;
};

export type UiStepMainProps = {
  readonly charts: UiChartsProps;
  readonly details: UiTestSetDetailsProps;
  readonly grid: UiTestsGridProps;
  readonly taskContext: {
    readonly entityType: 'TestSet';
    readonly entityId: string;
    readonly currentUserId: string;
    readonly currentUserName: string;
    readonly currentUserPicture?: string;
  } | null;
};