'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/common/NotificationContext';
import { useTasksData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import StepTasksGrid from '../ui/steps/StepTasksGrid';
import StepStats from '../ui/steps/StepStats';
import type {
  UiPagination,
  UiTaskRow,
  UiTasksGridProps,
  UiTasksStatsProps,
} from '../ui/types';

const DEFAULT_PAGINATION: UiPagination = { page: 0, pageSize: 25 } as const;

export default function TasksContainer() {
  const router = useRouter();
  const notifications = useNotifications();

  const [pagination, setPagination] = React.useState<UiPagination>(DEFAULT_PAGINATION);
  const [selectedIds, setSelectedIds] = React.useState<readonly string[]>([]);
  const [filter, setFilter] = React.useState<string | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const skip = pagination.page * pagination.pageSize;
  const limit = pagination.pageSize;

  const { tasks, totalCount, isLoading, isFetching, isError, errorMessage, refetch, deleteTasks } =
    useTasksData({ skip, limit, filter });

  const rows: readonly UiTaskRow[] = React.useMemo(
      () =>
          tasks.map((t) => ({
            id: String(t.id ?? ''),                 // always a string
            title: t.title ?? '',                   // <-- fix: require string
            description: t.description ?? '',       // string | null is allowed; '' is fine
            statusName: t.status?.name ?? null,
            assigneeName: t.assignee?.name ?? null,
            assigneePicture: t.assignee?.picture ?? null,
          })) as readonly UiTaskRow[],
      [tasks],
  );

  const stats: UiTasksStatsProps = React.useMemo(() => {
    const by = (name: string) => tasks.filter((t) => t.status?.name === name).length;
    return {
      total: (totalCount ?? 0) || tasks.length,
      open: by('Open'),
      inProgress: by('In Progress'),
      completed: by('Completed'),
      cancelled: by('Cancelled'),
      loading: isLoading || isFetching,
      updating: !isLoading && isFetching,
      errorMessage,
    } satisfies UiTasksStatsProps;
  }, [tasks, totalCount, isLoading, isFetching, errorMessage]);

  const onCreate = React.useCallback(() => {
    router.push('/tasks/create');
  }, [router]);

  const onRowClick = React.useCallback(
    (id: string) => {
      router.push(`/tasks/${id}`);
    },
    [router],
  );

  const onDeleteSelected = React.useCallback(() => {
    if (selectedIds.length === 0) return;
    setDeleteOpen(true);
  }, [selectedIds.length]);

  const confirmDelete = React.useCallback(async () => {
    try {
      await deleteTasks(selectedIds);
      notifications.show('Task(s) deleted successfully', { severity: 'success' });
      setSelectedIds([]);
      setDeleteOpen(false);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete tasks';
      notifications.show(msg, { severity: 'error' });
      setDeleteOpen(false);
      await refetch();
    }
  }, [deleteTasks, notifications, selectedIds, refetch]);

  const gridProps: UiTasksGridProps = {
    rows,
    totalRows: totalCount,
    pagination,
    onPaginationChange: setPagination,
    onRowClick,
    selectedRowIds: selectedIds,
    onSelectedRowIdsChange: setSelectedIds,
    onCreateClick: onCreate,
    onDeleteSelectedClick: selectedIds.length > 0 ? onDeleteSelected : undefined,
    onFilterChange: setFilter,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error: isError ? errorMessage ?? 'Failed to load tasks' : undefined,
    deleteDialog: {
      open: deleteOpen,
      onCancel: () => setDeleteOpen(false),
      onConfirm: confirmDelete,
      isLoading: false,
      count: selectedIds.length,
    },
  } satisfies UiTasksGridProps;

  return (
    <FeaturePageFrame title="Tasks" breadcrumbs={[{ title: 'Tasks', path: '/tasks' }]}>
      <StepperHeader title="Overview" />
      <ActionBar />
      <StepStats {...stats} />
      <StepTasksGrid {...gridProps} />
    </FeaturePageFrame>
  );
}