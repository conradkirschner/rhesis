'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDeleteTestSets, useTestSetsList } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepList from '../ui/steps/StepList';
import type {
  UiAction,
  UiStepListProps,
  UiTestSetRow,
} from '../ui/types';

export default function TestSetsContainer() {
  const router = useRouter();

  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);
  const [selectedIds, setSelectedIds] = React.useState<readonly string[]>([]);

  const { rows, totalCount, isLoading, refetch } = useTestSetsList({ page, pageSize });
  const { isDeleting, deleteMany } = useDeleteTestSets();

  const shapedRows: readonly UiTestSetRow[] = rows.map((r) => {
    const displayName =
      r.assignee?.name ||
      `${r.assignee?.given_name ?? ''} ${r.assignee?.family_name ?? ''}`.trim() ||
      r.assignee?.email ||
      '';
    return {
      id: r.id,
      name: r.name,
      behaviors: r.behaviors,
      categories: r.categories,
      totalTests: r.totalTests,
      status: r.statusLabel,
      assigneeDisplay: displayName || undefined,
      assigneeAvatarUrl: r.assignee?.picture,
      comments: r.counts?.comments ?? 0,
      tasks: r.counts?.tasks ?? 0,
    };
  }) satisfies readonly UiTestSetRow[];

  const actions: readonly UiAction[] = [
    {
      label: 'New Test Set',
      variant: 'contained',
      onClick: () => router.push('/test-sets/new'),
      'data-test-id': 'new-test-set',
    },
    ...(selectedIds.length > 0
      ? ([
          {
            label: selectedIds.length > 1 ? 'Run Test Sets' : 'Run Test Set',
            variant: 'contained',
            onClick: () => router.push(`/test-sets/execute?ids=${selectedIds.join(',')}`),
            'data-test-id': 'run-test-sets',
          },
          {
            label: 'Delete Test Sets',
            variant: 'contained',
            color: 'error',
            disabled: isDeleting,
            onClick: async () => {
              await deleteMany(selectedIds);
              setSelectedIds([]);
              await refetch();
            },
            'data-test-id': 'delete-test-sets',
          },
        ] as const)
      : ([] as const)),
  ] as const;

  const listProps: UiStepListProps = {
    rows: shapedRows,
    totalRows: totalCount,
    page,
    pageSize,
    onPageChange: (p) => setPage(p),
    onPageSizeChange: (s) => {
      setPageSize(s);
      setPage(0);
    },
    selectedIds,
    onSelectionChange: (ids) => setSelectedIds(ids),
    onRowClick: (id) => router.push(`/test-sets/${id}`),
    loading: isLoading || isDeleting,
    onNew: actions[0]?.onClick ?? (() => {}),
    onRun: actions.find((a) => a['data-test-id'] === 'run-test-sets')?.onClick ?? (() => {}),
    onDelete: actions.find((a) => a['data-test-id'] === 'delete-test-sets')?.onClick ?? (() => {}),
  };

  return (
    <FeaturePageFrame title="Test Sets" breadcrumbs={[{ title: 'Test Sets', path: '/test-sets' }]}>
      <StepperHeader title="Manage your test sets" />
      <ActionBar actions={actions} />
      {isLoading && <InlineLoader />}
      <ErrorBanner error={null} />
      <StepList {...listProps} />
    </FeaturePageFrame>
  );
}