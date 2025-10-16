'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/common/NotificationContext';
import { useTestsData, CreateTestInput, PriorityLevel } from '@/hooks/data/Tests/useTestsData';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import { UiTestRow, UiCreateTestFormData, UiLookupSets } from '../ui/types';
import StepSummaryCharts from '../ui/steps/StepSummaryCharts';
import StepTestsTable from '../ui/steps/StepTestsTable';

export default function TestsContainer() {
  const router = useRouter();
  const notifications = useNotifications();
  const { data: session, status } = useSession();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [odataFilter, setOdataFilter] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);

  const skip = page * pageSize;

  const { list, lookups, stats, mutations } = useTestsData({
    skip,
    limit: pageSize,
    sortBy: 'created_at',
    sortOrder: 'desc',
    odataFilter,
  });

  const uiRows: readonly UiTestRow[] = useMemo(
    () =>
      list.rows.map((r) => ({
        id: r.id,
        content: r.promptContent,
        behaviorName: r.behaviorName,
        topicName: r.topicName,
        categoryName: r.categoryName,
        assigneeDisplay: r.assignee?.displayName ?? '',
        assigneePicture: r.assignee?.picture,
        comments: r.counts.comments,
        tasks: r.counts.tasks,
      })) satisfies readonly UiTestRow[],
    [list.rows],
  );

  const uiLookups: UiLookupSets = useMemo(
    () => ({
      behaviors: lookups.behaviors,
      topics: lookups.topics,
      categories: lookups.categories,
      users: lookups.users,
      statuses: lookups.statuses,
    }),
    [lookups.behaviors, lookups.topics, lookups.categories, lookups.users, lookups.statuses],
  );

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/tests/${id}`);
    },
    [router],
  );

  const handleDelete = useCallback(async (ids: readonly string[]) => {
    try {
      await mutations.deleteTests(ids);
      await list.refetch();
      setSelectedIds([]);
      notifications.show(
        `Successfully deleted ${ids.length} ${ids.length === 1 ? 'test' : 'tests'}`,
        { severity: 'success', autoHideDuration: 4000 },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Delete tests failed', err);
      notifications.show('Failed to delete tests', { severity: 'error', autoHideDuration: 6000 });
    }
  }, [mutations, list, notifications]);

  const handleAssociate = useCallback(async (testSetId: string, ids: readonly string[]) => {
    try {
      await mutations.associateWithTestSet(testSetId, ids);
      notifications.show(
        `Successfully associated ${ids.length} ${ids.length === 1 ? 'test' : 'tests'}`,
        { severity: 'success', autoHideDuration: 6000 },
      );
      setSelectedIds([]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Associate tests -> test set failed', err);
      notifications.show('Failed to associate tests with test set', {
        severity: 'error',
        autoHideDuration: 6000,
      });
    }
  }, [mutations, notifications]);

  const handleCreate = useCallback(async (data: UiCreateTestFormData) => {
    try {
      const input: CreateTestInput = {
        promptContent: data.promptContent,
        behaviorName: data.behaviorName,
        topicName: data.topicName,
        categoryName: data.categoryName,
        priorityLevel: data.priorityLevel as PriorityLevel,
        assigneeId: data.assigneeId ?? null,
        ownerId: data.ownerId ?? null,
        statusId: data.statusId,
      };
      await mutations.createSingleTest(input);
      await list.refetch();
      notifications.show('Test created', { severity: 'success', autoHideDuration: 4000 });
    } catch (err) {
      notifications.show(err instanceof Error ? err.message : 'Failed to create test', {
        severity: 'error',
        autoHideDuration: 6000,
      });
    }
  }, [mutations, list, notifications]);

  const handleGenerate = useCallback(() => {
    router.push('/tests/new-generated');
  }, [router]);

  const handleWriteMultiple = useCallback(() => {
    router.push('/tests/new?multiple=true');
  }, [router]);

  if (status === 'loading') {
    return (
      <FeaturePageFrame title="Tests" breadcrumbs={[{ title: 'Tests', path: '/tests' }]}>
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  if (!session?.session_token) {
    return (
      <FeaturePageFrame title="Tests" breadcrumbs={[{ title: 'Tests', path: '/tests' }]}>
        <ErrorBanner message="No session token available" />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame title="Tests" breadcrumbs={[{ title: 'Tests', path: '/tests' }]}>
      <StepperHeader title="Overview" subtitle="Recent distribution" />
      <StepSummaryCharts
        behavior={stats.pies.behavior}
        topic={stats.pies.topic}
        category={stats.pies.category}
        status={stats.pies.status}
        loading={stats.isFetching}
        error={stats.error ?? undefined}
      />

      <ActionBar />

      <StepTestsTable
        rows={uiRows}
        totalCount={list.totalCount}
        loading={list.isFetching}
        error={list.error ?? undefined}
        page={page}
        pageSize={pageSize}
        onPaginationChange={(next) => {
          setPage(next.page);
          setPageSize(next.pageSize);
        }}
        onFilterODataChange={(odata) => {
          setPage(0);
          setOdataFilter(odata || undefined);
        }}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onRowClick={handleRowClick}
        onDeleteSelected={() => handleDelete(selectedIds)}
        onAssociateSelected={(testSetId) => handleAssociate(testSetId, selectedIds)}
        onCreateTest={handleCreate}
        onGenerateTests={handleGenerate}
        onWriteMultiple={handleWriteMultiple}
      />
    </FeaturePageFrame>
  );
}