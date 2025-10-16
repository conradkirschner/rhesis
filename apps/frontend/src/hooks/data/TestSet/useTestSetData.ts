import { useCallback, useMemo } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

// SDK types are used internally only in this file
import type {
  EntityStats,
  TestDetail,
  TestSet,
  EndpointEnvironment,
  TestSetExecutionRequest,
  ProjectDetail,
  EndpointDetail,
} from '@/api-client/types.gen';

import {
  readTestSetTestSetsTestSetIdentifierGetOptions,
  generateTestSetTestStatsTestSetsTestSetIdentifierStatsGetOptions,
  getTestSetTestsTestSetsTestSetIdentifierTestsGetOptions,
  disassociateTestsFromTestSetTestSetsTestSetIdDisassociatePostMutation,
  updateTestSetTestSetsTestSetIdPutMutation,
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type Id = string;

export type TestRow = {
  readonly id: string;
  readonly promptContent: string;
  readonly behaviorName?: string;
  readonly topicName?: string;
};

export function useTestSetData(identifier: string) {
  const testSetQuery = useQuery({
    ...readTestSetTestSetsTestSetIdentifierGetOptions({
      path: { test_set_identifier: identifier },
    }),
    staleTime: 60_000,
    enabled: Boolean(identifier),
  });

  const statsQuery = useQuery({
    ...generateTestSetTestStatsTestSetsTestSetIdentifierStatsGetOptions({
      path: { test_set_identifier: identifier },
      query: { top: 5, months: 6, mode: 'related_entity' },
    }),
    staleTime: 60_000,
    enabled: Boolean(identifier),
  });

  const testSet: TestSet | null = (testSetQuery.data as TestSet | { data?: TestSet } | undefined)
    ? ('data' in (testSetQuery.data as object)
        ? ((testSetQuery.data as { data?: TestSet }).data ?? null)
        : (testSetQuery.data as TestSet))
    : null;

  const stats: EntityStats | null = (statsQuery.data as EntityStats | { data?: EntityStats } | undefined)
    ? ('data' in (statsQuery.data as object)
        ? ((statsQuery.data as { data?: EntityStats }).data ?? null)
        : (statsQuery.data as EntityStats))
    : null;

  return {
    testSet,
    stats,
    isFetching: testSetQuery.isFetching || statsQuery.isFetching,
    error:
      (testSetQuery.error as Error | undefined)?.message ??
      (statsQuery.error as Error | undefined)?.message ??
      null,
    refetchAll: () => {
      void testSetQuery.refetch();
      void statsQuery.refetch();
    },
  };
}

export function useTestSetTests(
  identifier: string,
  pagination: { page: number; pageSize: number; orderBy?: 'topic' | 'behavior' | 'created_at'; order?: 'asc' | 'desc' } = {
    page: 0,
    pageSize: 50,
    orderBy: 'topic',
    order: 'asc',
  },
) {
  const testsQuery = useQuery({
    ...getTestSetTestsTestSetsTestSetIdentifierTestsGetOptions({
      path: { test_set_identifier: identifier },
      query: {
        skip: pagination.page * pagination.pageSize,
        limit: pagination.pageSize,
        order_by: pagination.orderBy ?? 'topic',
        order: pagination.order ?? 'asc',
      },
    }),
    enabled: Boolean(identifier),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const normalized = useMemo(() => {
    const raw = testsQuery.data as
      | TestDetail[]
      | { data?: TestDetail[]; pagination?: { totalCount?: number } }
      | undefined;

    if (!raw) return { rows: [] as TestRow[], totalCount: 0 };

    const toRow = (t: TestDetail): TestRow => ({
      id: String(t.id),
      promptContent: t.prompt?.content ?? '',
      behaviorName: t.behavior?.name ?? undefined,
      topicName: t.topic?.name ?? undefined,
    });

    if (Array.isArray(raw)) {
      return { rows: raw.map(toRow), totalCount: raw.length };
    }
    const data = Array.isArray(raw.data) ? raw.data : [];
    const total =
      typeof raw.pagination?.totalCount === 'number' ? raw.pagination.totalCount : data.length;
    return { rows: data.map(toRow), totalCount: total };
  }, [testsQuery.data]);

  return {
    ...normalized,
    isFetching: testsQuery.isFetching,
    error: (testsQuery.error as Error | undefined)?.message ?? null,
    refetch: () => void testsQuery.refetch(),
  };
}

export function useTestSetMutations(testSetId: Id, token?: string) {
  const updateMutation = useMutation({
    ...updateTestSetTestSetsTestSetIdPutMutation(),
  });

  const disassociateMutation = useMutation({
    ...disassociateTestsFromTestSetTestSetsTestSetIdDisassociatePostMutation(),
  });

  const executeMutation = useMutation({
    ...executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation(),
  });

  const updateName = useCallback(
    (name: string) =>
      updateMutation.mutate({
        path: { test_set_id: testSetId },
        body: { name },
      }),
    [testSetId, updateMutation],
  );

  const updateDescription = useCallback(
    (description: string) =>
      updateMutation.mutate({
        path: { test_set_id: testSetId },
        body: { description },
      }),
    [testSetId, updateMutation],
  );

  const disassociateTests = useCallback(
    (testIds: readonly string[]) =>
      disassociateMutation.mutate({
        path: { test_set_id: testSetId },
        body: { test_ids: [...testIds] },
      }),
    [testSetId, disassociateMutation],
  );

  const execute = useCallback(
    (testSetIdentifier: Id, endpointId: Id, executionMode: TestSetExecutionRequest['execution_mode']) =>
      executeMutation.mutate({
        path: { test_set_identifier: testSetIdentifier, endpoint_id: endpointId },
        body: { execution_mode: executionMode },
      }),
    [executeMutation],
  );

  const download = useCallback(async () => {
    if (!token) throw new Error('Missing auth token');
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const res = await fetch(`${base}/test-sets/${encodeURIComponent(testSetId)}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Download failed: ${res.status} ${text}`);
    }
    return res.blob();
  }, [testSetId, token]);

  return {
    updateName,
    updateDescription,
    disassociateTests,
    execute,
    download,
    pending: {
      update: updateMutation.isPending,
      disassociate: disassociateMutation.isPending,
      execute: executeMutation.isPending,
    },
    errors: {
      update: (updateMutation.error as Error | undefined)?.message ?? null,
      disassociate: (disassociateMutation.error as Error | undefined)?.message ?? null,
      execute: (executeMutation.error as Error | undefined)?.message ?? null,
    },
  };
}

export function useLookups(enabled: boolean) {
  const projectsQuery = useQuery({
    ...readProjectsProjectsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', limit: 100 } }),
    enabled,
    staleTime: 300_000,
  });

  const endpointsQuery = useQuery({
    ...readEndpointsEndpointsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', limit: 100 } }),
    enabled,
    staleTime: 300_000,
  });

  const projects: readonly ProjectDetail[] = projectsQuery.data?.data ?? [];
  const endpoints: readonly EndpointDetail[] = endpointsQuery.data?.data ?? [];

  return {
    projects,
    endpoints,
    isFetching: projectsQuery.isFetching || endpointsQuery.isFetching,
    error:
      (projectsQuery.error as Error | undefined)?.message ??
      (endpointsQuery.error as Error | undefined)?.message ??
      null,
    filterEndpointsByProject: (projectId: Id | null) =>
      projectId ? endpoints.filter((e) => (e.project_id ?? null) === projectId) : [],
  };
}

export type UiEndpoint = {
  readonly id: string;
  readonly name: string;
  readonly environment?: EndpointEnvironment;
  readonly project_id?: string;
};

export type UiProject = {
  readonly id: string;
  readonly name: string;
};