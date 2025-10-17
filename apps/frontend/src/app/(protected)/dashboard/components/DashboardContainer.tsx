'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  useDashboardChartsData,
  useRecentActivitiesData,
  useRecentTestSetsData,
  useRecentTestsData,
} from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import DashboardCharts from '../ui/DashboardCharts';
import RecentTestsTable from '../ui/RecentTestsTable';
import RecentActivitiesTable from '../ui/RecentActivitiesTable';
import RecentTestSetsTable from '../ui/RecentTestSetsTable';
import type {
  UiDashboardChartsProps,
  UiRecentActivitiesProps,
  UiRecentTestSetsProps,
  UiRecentTestsProps,
} from '../ui/types';

export default function DashboardContainer() {
  const { data: session } = useSession();
  if (!session?.user) throw new Error('auth error');

  const [testsPagination, setTestsPagination] = React.useState({ page: 0, pageSize: 10 });
  const [activitiesPagination, setActivitiesPagination] = React.useState({ page: 0, pageSize: 10 });
  const [testSetsPagination, setTestSetsPagination] = React.useState({ page: 0, pageSize: 10 });

  const testsSkip = testsPagination.page * testsPagination.pageSize;
  const activitiesSkip = activitiesPagination.page * activitiesPagination.pageSize;
  const testSetsSkip = testSetsPagination.page * testSetsPagination.pageSize;

  const charts = useDashboardChartsData();
  const recentTests = useRecentTestsData({ skip: testsSkip, limit: testsPagination.pageSize });
  const recentActivities = useRecentActivitiesData({
    skip: activitiesSkip,
    limit: activitiesPagination.pageSize,
  });
  const recentTestSets = useRecentTestSetsData({
    skip: testSetsSkip,
    limit: testSetsPagination.pageSize,
  });

  const chartsProps = {
    isLoading: charts.isLoading,
    errorMessage: charts.errorMessage,
    testCasesData: charts.testCasesData,
    testExecutionTrendData: charts.testExecutionTrendData,
    behaviorData: charts.behaviorData,
    categoryData: charts.categoryData,
  } satisfies UiDashboardChartsProps;

  const recentTestsProps = {
    rows: recentTests.rows.map((r) => ({
      id: r.id,
      behaviorName: r.behaviorName,
      topicName: r.topicName,
      promptContent: r.promptContent ?? 'No prompt',
      ownerDisplay: r.ownerDisplay ?? 'No owner',
    })),
    totalRows: recentTests.totalRows,
    paginationModel: testsPagination,
    onPaginationModelChange: setTestsPagination,
    loading: recentTests.isLoading || recentTests.isFetching,
    errorMessage: recentTests.errorMessage,
  } satisfies UiRecentTestsProps;

  const recentActivitiesProps = {
    rows: recentActivities.rows.map((r) => ({
      id: r.id,
      behaviorName: r.behaviorName,
      topicName: r.topicName,
      updatedAt: r.updatedAt ?? '',
      assigneeDisplay: r.assigneeDisplay ?? 'No assignee',
    })),
    totalRows: recentActivities.totalRows,
    paginationModel: activitiesPagination,
    onPaginationModelChange: setActivitiesPagination,
    loading: recentActivities.isLoading || recentActivities.isFetching,
    errorMessage: recentActivities.errorMessage,
  } satisfies UiRecentActivitiesProps;

  const recentTestSetsProps = {
    rows: recentTestSets.rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      visibility: r.visibility,
    })),
    totalRows: recentTestSets.totalRows,
    paginationModel: testSetsPagination,
    onPaginationModelChange: setTestSetsPagination,
    loading: recentTestSets.isLoading || recentTestSets.isFetching || false,
    errorMessage: recentTestSets.errorMessage,
  } satisfies UiRecentTestSetsProps;

  return (
    <FeaturePageFrame
      charts={<DashboardCharts {...chartsProps} />}
      sections={[
        {
          key: 'new-tests',
          kind: 'tests',
          title: 'Newest Tests',
          content: <RecentTestsTable {...recentTestsProps} />,
        },
        {
          key: 'updated-tests',
          kind: 'activities',
          title: 'Updated Tests',
          content: <RecentActivitiesTable {...recentActivitiesProps} />,
        },
        {
          key: 'new-test-sets',
          kind: 'testSets',
          title: 'Newest Test Sets',
          content: <RecentTestSetsTable {...recentTestSetsProps} />,
        },
        {
          key: 'recent-test-runs',
          kind: 'testRuns',
          title: 'Recent Test Runs',
          content: <RecentActivitiesTable {...recentActivitiesProps} />,
        },
      ]}
    />
  );
}