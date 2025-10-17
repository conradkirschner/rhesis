'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/common/NotificationContext';
import { useLookups, useTestSetData, useTestSetMutations, useTestSetTests } from '@/hooks/data';
import type {
  UiActionBarProps,
  UiChartsProps,
  UiErrorBannerProps,
  UiExecuteDrawerProps,
  UiFeaturePageFrameProps,
  UiInlineLoaderProps,
  UiTestSetDetailsProps,
  UiTestsGridProps,
  UiStepMainProps,
} from '../ui/types';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepMain from '../ui/steps/StepMain';

type Props = {
  identifier: string;
  sessionToken: string;
  currentUser: { id: string; name: string; picture?: string };
};

export default function TestSetContainer({ identifier, sessionToken, currentUser }: Props) {
  const router = useRouter();
  const notifications = useNotifications();

  const [pagination, setPagination] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 50,
  });
  const [executeOpen, setExecuteOpen] = useState(false);

  const { testSet, stats, isFetching, error, refetchAll } = useTestSetData(identifier);
  const tests = useTestSetTests(identifier, { ...pagination, orderBy: 'topic', order: 'asc' });
  const { projects, endpoints, isFetching: lookupsLoading, error: lookupsError, filterEndpointsByProject } =
      useLookups(executeOpen);

  const { updateName, updateDescription, disassociateTests, execute, download, pending, errors } =
      useTestSetMutations(String(testSet?.id ?? ''), sessionToken);

  const title = testSet?.name ?? `Test Set ${identifier}`;
  const breadcrumbs = useMemo(
      () =>
          [
            { title: 'Test Sets', path: '/test-sets' },
            { title, path: `/test-sets/${identifier}` },
          ] as const,
      [identifier, title],
  );

  // Children are provided by JSX below, so omit it from this object.
  const pageFrameProps = { title, breadcrumbs } satisfies Omit<UiFeaturePageFrameProps, 'children'>;

  const loaderProps = { show: isFetching } satisfies UiInlineLoaderProps;

  const errorProps = {
    message: error ?? null,
    onRetry: refetchAll,
  } satisfies UiErrorBannerProps;

  const chartsProps: UiChartsProps = {
    stats,
  };

  const detailsProps: UiTestSetDetailsProps = {
    name: testSet?.name ?? '',
    description: testSet?.description ?? '',
    metadata: {
      behaviors: testSet?.attributes?.metadata?.behaviors ?? [],
      categories: testSet?.attributes?.metadata?.categories ?? [],
      topics: testSet?.attributes?.metadata?.topics ?? [],
      sources:
          testSet?.attributes?.metadata?.sources?.map((s) => ({
            name: s.name ?? undefined,
            document: s.document ?? undefined,
            description: s.description ?? undefined,
          })) ?? [],
    },
    tags: (testSet?.tags ?? []).map((t) => t.name),
    updating: pending.update,
    onEditName: (name) => {
      updateName(name);
    },
    onEditDescription: (desc) => {
      updateDescription(desc);
    },
    onDownload: async () => {
      try {
        const blob = await download();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test_set_${testSet?.id}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        notifications.show((e as Error).message, { severity: 'error' });
      }
    },
  };

  const gridProps: UiTestsGridProps = {
    rows: tests.rows,
    totalRows: tests.totalCount,
    loading: tests.isFetching || pending.disassociate,
    pagination,
    onPaginationChange: (next) => setPagination(next),
    onRowClick: (id) => router.push(`/tests/${encodeURIComponent(String(id))}`),
    onRemoveSelected: (ids) => {
      if (!ids.length) return;
      disassociateTests(ids);
    },
    error: tests.error ?? errors.disassociate ?? null,
    onRefetch: tests.refetch,
  };

  const actionBarProps = {
    onExecute: () => setExecuteOpen(true),
    onDownload: detailsProps.onDownload,
  } satisfies UiActionBarProps;

  const executeDrawerProps: UiExecuteDrawerProps = {
    open: executeOpen,
    loading: lookupsLoading || pending.execute,
    error: lookupsError ?? errors.execute ?? null,
    projects: projects.map((p) => ({ id: String(p.id), name: p.name ?? '' })),
    endpoints: endpoints.map((e) => ({
      id: String(e.id),
      name: e.name ?? '',
      environment: e.environment,
      // keep both for compatibility; drawer type can ignore the extra prop
      project_id: e.project_id ? String(e.project_id) : undefined,
      projectId: e.project_id ? String(e.project_id) : undefined,
    })) as unknown as UiExecuteDrawerProps['endpoints'],
    onClose: () => setExecuteOpen(false),
    onExecute: ({ endpointId, executionMode }) => {
      execute(identifier, endpointId, executionMode);
      notifications.show('Test set execution started successfully!', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      setExecuteOpen(false);
    },
    filterEndpointsByProject: (projectId) =>
        filterEndpointsByProject(projectId).map((e) => ({
          id: String(e.id),
          name: e.name ?? '',
          environment: e.environment,
          project_id: e.project_id ? String(e.project_id) : undefined,
          projectId: e.project_id ? String(e.project_id) : undefined,
        })) as unknown as UiExecuteDrawerProps['endpoints'],
  };

  const stepMainProps: UiStepMainProps = {
    charts: chartsProps,
    details: detailsProps,
    grid: gridProps,
    taskContext: testSet?.id
        ? {
          entityType: 'TestSet',
          entityId: String(testSet.id),
          currentUserId: currentUser.id,
          currentUserName: currentUser.name,
          currentUserPicture: currentUser.picture,
        }
        : null,
  };

  return (
      <FeaturePageFrame {...pageFrameProps}>
        <StepperHeader title={title} />
        <ActionBar {...actionBarProps} />
        <InlineLoader {...loaderProps} />
        <ErrorBanner {...errorProps} />
        <StepMain {...stepMainProps} />
        {/* Execute drawer mounted at page end */}
        {/* UI handles local selection and calls back with final payload */}
        <StepMain.ExecuteDrawer {...executeDrawerProps} />
      </FeaturePageFrame>
  );
}
