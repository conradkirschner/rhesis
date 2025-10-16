'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import type {
  UiDashboardViewProps,
  UiPagination,
  UiTestRow,
  UiTestSetRow,
} from '../ui/types';
import { useDashboardData } from '../../../hooks/data/Dashboard/useDashboardData';

export default function DashboardContainer() {
  const { data: session } = useSession();
  if (!session?.user) {
    throw new Error('auth error');
  }

  const [created, setCreated] = useState<UiPagination>({ page: 0, pageSize: 10 });
  const [updated, setUpdated] = useState<UiPagination>({ page: 0, pageSize: 10 });
  const [sets, setSets] = useState<UiPagination>({ page: 0, pageSize: 10 });

  const createdSkip = created.page * created.pageSize;
  const updatedSkip = updated.page * updated.pageSize;
  const setsSkip = sets.page * sets.pageSize;

  const data = useDashboardData({
    months: 6,
    top: 5,
    recentCreated: { skip: createdSkip, limit: created.pageSize },
    recentUpdated: { skip: updatedSkip, limit: updated.pageSize },
    testSets: { skip: setsSkip, limit: sets.pageSize },
  });

  const onChangeCreated = useCallback((page: number, pageSize: number) => {
    setCreated({ page, pageSize });
  }, []);
  const onChangeUpdated = useCallback((page: number, pageSize: number) => {
    setUpdated({ page, pageSize });
  }, []);
  const onChangeSets = useCallback((page: number, pageSize: number) => {
    setSets({ page, pageSize });
  }, []);

  const props = {
    charts: {
      data: data.charts,
      isLoading: data.chartsLoading,
      error: data.chartsError,
    },
    recentCreated: {
      title: 'Newest Tests',
      rows: data.recentCreated.rows as readonly UiTestRow[],
      totalRows: data.recentCreated.totalRows,
      loading: data.recentCreated.loading,
      error: data.recentCreated.error,
      pagination: created,
      onChangePagination: onChangeCreated,
      linkBasePath: '/tests',
    },
    recentUpdated: {
      title: 'Updated Tests',
      rows: data.recentUpdated.rows as readonly UiTestRow[],
      totalRows: data.recentUpdated.totalRows,
      loading: data.recentUpdated.loading,
      error: data.recentUpdated.error,
      pagination: updated,
      onChangePagination: onChangeUpdated,
      linkBasePath: '/tests',
    },
    testSets: {
      title: 'Newest Test Sets',
      rows: data.testSets.rows as readonly UiTestSetRow[],
      totalRows: data.testSets.totalRows,
      loading: data.testSets.loading,
      error: data.testSets.error,
      pagination: sets,
      onChangePagination: onChangeSets,
      linkBasePath: '/test-sets',
    },
  } satisfies UiDashboardViewProps;

  return <FeaturePageFrame {...props} />;
}