'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useTestRunsData } from '@/hooks/data/TestRuns/useTestRunsData';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import ActionBar from '../ui/ActionBar';
import StepDashboard from '../ui/steps/StepDashboard';
import type {
  UiActionButton,
  UiBreadcrumb,
  UiPaginationModel,
  UiPieDatum,
  UiTestRunRow,
  UiUserOption,
  UiProjectOption,
  UiTestSetOption,
  UiEndpointOption,
} from '../ui/types';

export default function TestRunsContainer() {
  const { data: session, status } = useSession();

  const [pagination, setPagination] = React.useState<UiPaginationModel>({ page: 0, pageSize: 50 });
  const [selection, setSelection] = React.useState<readonly (string)[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const [assignee, setAssignee] = React.useState<UiUserOption | null>(null);
  const [owner, setOwner] = React.useState<UiUserOption | null>(null);
  const [testSet, setTestSet] = React.useState<UiTestSetOption | null>(null);
  const [project, setProject] = React.useState<UiProjectOption | null>(null);
  const [endpoint, setEndpoint] = React.useState<UiEndpointOption | null>(null);

  const { list, stats, lookups, mutate, invalidate } = useTestRunsData({
    page: pagination.page,
    pageSize: pagination.pageSize,
    enableLookups: isDrawerOpen,
  });

  React.useEffect(() => {
    const currentUserId = (session?.user as { id?: string } | undefined)?.id;
    if (isDrawerOpen && currentUserId && !owner && lookups.users.length > 0) {
      const me = lookups.users.find((u) => String(u.id) === String(currentUserId));
      if (me) {
        setOwner({
          id: me.id,
          displayName:
            me.name ||
            `${me.given_name ?? ''} ${me.family_name ?? ''}`.trim() ||
            me.email ||
            'Unknown',
          picture: me.picture ?? undefined,
        });
      }
    }
  }, [isDrawerOpen, session?.user, lookups.users, owner]);

  const rows = React.useMemo(
    () =>
      list.rows.map((r) => {
        const displayName =
          r.user?.name ||
          `${r.user?.given_name ?? ''} ${r.user?.family_name ?? ''}`.trim() ||
          r.user?.email ||
          'Unknown';

        return {
          id: r.id,
          name: r.name ?? '',
          testSetName: r.test_configuration?.test_set?.name ?? '',
          totalTests: r.attributes?.total_tests ?? 0,
          totalExecutionTimeMs: r.attributes?.total_execution_time_ms ?? undefined,
          status: r.status?.name ?? r.attributes?.status ?? '',
          executor: r.user
            ? {
                displayName,
                picture: r.user.picture ?? undefined,
              }
            : undefined,
          counts: {
            comments: r.counts?.comments ?? 0,
            tasks: r.counts?.tasks ?? 0,
          },
        };
      }) satisfies readonly UiTestRunRow[],
    [list.rows],
  );

  const statusChart = React.useMemo(
    () =>
      (stats.data?.status_distribution ?? [])
        .slice(0, 5)
        .map((d) => ({ name: d.status.length <= 15 ? d.status : `${d.status.slice(0, 12)}…`, value: d.count, fullName: d.status })) satisfies readonly UiPieDatum[],
    [stats.data?.status_distribution],
  );

  const resultsChart = React.useMemo(() => {
    const rd = stats.data?.result_distribution ?? { passed: 0, failed: 0, pending: 0 };
    const arr: UiPieDatum[] = [
      { name: 'Passed', value: rd.passed, fullName: 'Passed' },
      { name: 'Failed', value: rd.failed, fullName: 'Failed' },
      { name: 'Pending', value: rd.pending, fullName: 'Pending' },
    ].filter((x) => x.value > 0);
    return arr satisfies readonly UiPieDatum[];
  }, [stats.data?.result_distribution]);

  const testSetsChart = React.useMemo(
    () =>
      (stats.data?.most_run_test_sets ?? [])
        .slice(0, 5)
        .map((d) => ({
          name: d.test_set_name.length <= 15 ? d.test_set_name : `${d.test_set_name.slice(0, 12)}…`,
          value: d.run_count,
          fullName: d.test_set_name,
        })) satisfies readonly UiPieDatum[],
    [stats.data?.most_run_test_sets],
  );

  const executorsChart = React.useMemo(
    () =>
      (stats.data?.top_executors ?? [])
        .slice(0, 5)
        .map((d) => ({
          name: d.executor_name.length <= 15 ? d.executor_name : `${d.executor_name.slice(0, 12)}…`,
          value: d.run_count,
          fullName: d.executor_name,
        })) satisfies readonly UiPieDatum[],
    [stats.data?.top_executors],
  );

  const actionButtons = React.useMemo(() => {
    const listBtns: UiActionButton[] = [
      {
        label: 'New Test Run',
        variant: 'contained',
        onClick: () => setIsDrawerOpen(true),
        icon: null,
      },
    ];
    if (selection.length > 0) {
      listBtns.push({
        label: 'Delete Test Runs',
        variant: 'outlined',
        color: 'error',
        onClick: () => setIsDeleteOpen(true),
        icon: null,
      });
    }
    return listBtns satisfies readonly UiActionButton[];
  }, [selection.length]);

  const usersOptions = React.useMemo(
    () =>
      lookups.users.map((u) => ({
        id: u.id,
        displayName:
          u.name ||
          `${u.given_name ?? ''} ${u.family_name ?? ''}`.trim() ||
          u.email ||
          'Unknown',
        picture: u.picture ?? undefined,
      })) as readonly UiUserOption[],
    [lookups.users],
  );

  const testSetOptions = React.useMemo(
    () =>
      lookups.testSets.map((t) => ({ id: t.id, name: t.name })) as readonly UiTestSetOption[],
    [lookups.testSets],
  );

  const projectOptions = React.useMemo(
    () =>
      lookups.projects.map((p) => ({
        id: p.id,
        name: p.name,
        organizationId: p.organization_id ?? null,
      })) as readonly UiProjectOption[],
    [lookups.projects],
  );

  const endpointOptions = React.useMemo(
    () =>
      lookups.endpoints.map((e) => ({
        id: e.id,
        name: e.name,
        environment: e.environment ?? '',
        projectId: e.project_id ?? null,
        organizationId: e.organization_id ?? null,
      })) as readonly UiEndpointOption[],
    [lookups.endpoints],
  );

  const endpointsFiltered = React.useMemo(
    () =>
      endpointOptions.filter((e) => (project ? String(e.projectId) === String(project.id) : true)),
    [endpointOptions, project],
  );

  const handleSaveTestRun = async () => {
    if (!testSet || !project || !endpoint || !owner) return;
    await mutate.createAndExecute({
      endpointId: endpoint.id,
      testSetId: testSet.id,
      userId: owner.id,
      organizationId: endpoint.organizationId ?? project.organizationId ?? null,
    });
    await Promise.all([invalidate.list(), invalidate.stats()]);
    setIsDrawerOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selection.length === 0) return;
    await mutate.deleteMany(selection);
    await Promise.all([invalidate.list(), invalidate.stats()]);
    setSelection([]);
    setIsDeleteOpen(false);
  };

  const breadcrumbs = [{ title: 'Test Runs', path: '/test-runs' }] satisfies readonly UiBreadcrumb[];

  if (status === 'loading') {
    return (
      <FeaturePageFrame title="Test Runs" breadcrumbs={breadcrumbs}>
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  if (!session?.session_token) {
    return (
      <FeaturePageFrame title="Test Runs" breadcrumbs={breadcrumbs}>
        <ErrorBanner message="No session token available" />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame title="Test Runs" breadcrumbs={breadcrumbs}>
      {(stats.error || list.error) && <ErrorBanner message={stats.error || list.error || ''} />}
      <ActionBar buttons={actionButtons} />
      <StepDashboard
        charts={{
          status: statusChart,
          results: resultsChart,
          testSets: testSetsChart,
          executors: executorsChart,
        }}
        grid={{
          rows,
          totalRows: list.total,
          loading: list.isLoading || mutate.isPending,
          paginationModel: pagination,
          onPaginationModelChange: setPagination,
          onRowClick: (id) => {
            // handled by parent app routing; expose as noop here
            window.location.href = `/test-runs/${String(id)}`;
          },
          selection: selection,
          onSelectionChange: setSelection,
          actionButtons,
        }}
        drawer={{
          open: isDrawerOpen,
          loading: lookups.isLoading || mutate.isPending,
          error: lookups.error,
          onClose: () => setIsDrawerOpen(false),
          onSave: handleSaveTestRun,
          options: {
            users: usersOptions,
            projects: projectOptions,
            testSets: testSetOptions,
            endpoints: endpointsFiltered,
          },
          values: {
            assignee,
            owner,
            project,
            testSet,
            endpoint,
          },
          onChange: {
            assignee: setAssignee,
            owner: setOwner,
            project: (p) => {
              setProject(p);
              setEndpoint(null);
            },
            testSet: setTestSet,
            endpoint: setEndpoint,
          },
        }}
        deleteModal={{
          open: isDeleteOpen,
          loading: mutate.isPending,
          count: selection.length,
          onCancel: () => setIsDeleteOpen(false),
          onConfirm: handleDeleteConfirm,
        }}
      />
    </FeaturePageFrame>
  );
}