// src/hooks/data/testRuns/useTestRunsData.ts
import { useMemo } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  readTestRunsTestRunsGetOptions,
  deleteTestRunTestRunsTestRunIdDeleteMutation,
  generateTestRunStatsTestRunsStatsGetOptions,
  readUsersUsersGetOptions,
  readTestSetsTestSetsGetOptions,
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  createTestConfigurationTestConfigurationsPostMutation,
  executeTestConfigurationEndpointTestConfigurationsTestConfigurationIdExecutePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

type Id = string;

export type ListItem = {
  id: Id;
  name?: string | null;
  test_configuration?: {
    test_set?: { name?: string | null } | null;
  } | null;
  attributes?: {
    total_tests?: number | null;
    total_execution_time_ms?: number | null;
    status?: string | null;
  } | null;
  status?: { name?: string | null } | null;
  user?: {
    name?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    email?: string | null;
    picture?: string | null;
  } | null;
  counts?: { comments?: number | null; tasks?: number | null } | null;
};

type Stats =
    | {
  status_distribution?: readonly { status: string; count: number }[];
  result_distribution?: { passed: number; failed: number; pending: number };
  most_run_test_sets?: readonly { test_set_name: string; run_count: number }[];
  top_executors?: readonly { executor_name: string; run_count: number }[];
}
    | undefined;

type LookupUser = {
  id: Id;
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  email?: string | null;
  picture?: string | null;
};

type LookupProject = { id: Id; name: string; organization_id?: Id | null };
type LookupTestSet = { id: Id; name: string };
type LookupEndpoint = {
  id: Id;
  name: string;
  environment?: string | null;
  project_id?: Id | null;
  organization_id?: Id | null;
};

type UseTestRunsDataParams = {
  page: number;
  pageSize: number;
  enableLookups?: boolean;
};

export function useTestRunsData(params: UseTestRunsDataParams) {
  const { page, pageSize, enableLookups } = params;
  const queryClient = useQueryClient();

  const skip = page * pageSize;
  const limit = pageSize;

  // List
  const listQuery = useQuery({
    ...readTestRunsTestRunsGetOptions({
      query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
    }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    select: (raw): { rows: readonly ListItem[]; total: number } => {
      const rows = (raw as { data?: readonly ListItem[] } | undefined)?.data ?? [];
      const total =
          (raw as { pagination?: { totalCount?: number } } | undefined)?.pagination
              ?.totalCount ?? 0;
      return { rows, total };
    },
  });

  // ----- Stats (was useQueries → now four useQuery calls) -----
  const statusQ = useQuery({
    ...generateTestRunStatsTestRunsStatsGetOptions({
      query: { mode: 'status', top: 5, months: 6 },
    }),
    staleTime: 60_000,
  });

  const resultsQ = useQuery({
    ...generateTestRunStatsTestRunsStatsGetOptions({
      query: { mode: 'results', top: 5, months: 6 },
    }),
    staleTime: 60_000,
  });

  const testSetsQ = useQuery({
    ...generateTestRunStatsTestRunsStatsGetOptions({
      query: { mode: 'test_sets', top: 5, months: 6 },
    }),
    staleTime: 60_000,
  });

  const executorsQ = useQuery({
    ...generateTestRunStatsTestRunsStatsGetOptions({
      query: { mode: 'executors', top: 5, months: 6 },
    }),
    staleTime: 60_000,
  });

  const stats: Stats = useMemo(
      () => ({
        status_distribution:
            ((statusQ.data as { status_distribution?: { status: string; count: number }[] } | undefined)
                ?.status_distribution ?? []) as readonly { status: string; count: number }[],
        result_distribution:
            (resultsQ.data as { result_distribution?: { passed: number; failed: number; pending: number } } | undefined)
                ?.result_distribution ?? { passed: 0, failed: 0, pending: 0 },
        most_run_test_sets:
            ((testSetsQ.data as { most_run_test_sets?: { test_set_name: string; run_count: number }[] } | undefined)
                ?.most_run_test_sets ?? []) as readonly { test_set_name: string; run_count: number }[],
        top_executors:
            ((executorsQ.data as { top_executors?: { executor_name: string; run_count: number }[] } | undefined)
                ?.top_executors ?? []) as readonly { executor_name: string; run_count: number }[],
      }),
      [statusQ.data, resultsQ.data, testSetsQ.data, executorsQ.data],
  );

  // ----- Lookups (was useQueries → now four useQuery calls) -----
  const usersQ = useQuery({
    ...readUsersUsersGetOptions(),
    staleTime: 300_000,
    enabled: Boolean(enableLookups),
    select: (raw): readonly LookupUser[] =>
        ((raw as { data?: LookupUser[] } | undefined)?.data ?? []) as readonly LookupUser[],
  });

  const testSetsLookupQ = useQuery({
    ...readTestSetsTestSetsGetOptions({ query: { limit: 100 } }),
    staleTime: 300_000,
    enabled: Boolean(enableLookups),
    select: (raw): readonly LookupTestSet[] =>
        ((raw as { data?: LookupTestSet[] } | undefined)?.data ??
            []) as readonly LookupTestSet[],
  });

  const projectsQ = useQuery({
    ...readProjectsProjectsGetOptions(),
    staleTime: 300_000,
    enabled: Boolean(enableLookups),
    select: (raw): readonly LookupProject[] =>
        ((raw as { data?: LookupProject[] } | undefined)?.data ??
            []) as readonly LookupProject[],
  });

  const endpointsQ = useQuery({
    ...readEndpointsEndpointsGetOptions(),
    staleTime: 300_000,
    enabled: Boolean(enableLookups),
    select: (raw): readonly LookupEndpoint[] =>
        ((raw as { data?: LookupEndpoint[] } | undefined)?.data ??
            []) as readonly LookupEndpoint[],
  });

  // Mutations
  const deleteMutation = useMutation({
    ...deleteTestRunTestRunsTestRunIdDeleteMutation(),
  });

  const createConfigMutation = useMutation({
    ...createTestConfigurationTestConfigurationsPostMutation(),
  });

  const executeConfigMutation = useMutation({
    ...executeTestConfigurationEndpointTestConfigurationsTestConfigurationIdExecutePostMutation(),
  });

  const deleteMany = async (ids: readonly Id[]) => {
    await Promise.all(
        ids.map((id) =>
            deleteMutation.mutateAsync({
              path: { test_run_id: String(id) },
            }),
        ),
    );
  };

  const createAndExecute = async (p: {
    endpointId: Id;
    testSetId: Id;
    userId: Id;
    organizationId: Id | null | undefined;
  }) => {
    const created = await createConfigMutation.mutateAsync({
      body: {
        endpoint_id: p.endpointId,
        test_set_id: p.testSetId,
        user_id: p.userId,
        organization_id: p.organizationId ?? undefined,
      },
    });

    const createdId = (created as { id?: Id } | undefined)?.id;
    if (!createdId) throw new Error('Missing configuration id');

    await executeConfigMutation.mutateAsync({
      path: { test_configuration_id: String(createdId) },
    });
  };

  // Precise invalidations (queryKey retains generator _id objects)
  const invalidateList = async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
          Array.isArray(queryKey) &&
          queryKey.some(
              (q) =>
                  typeof q === 'object' &&
                  q !== null &&
                  (q as { _id?: string })._id === 'readTestRunsTestRunsGet',
          ),
    });
  };

  const invalidateStats = async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
          Array.isArray(queryKey) &&
          queryKey.some(
              (q) =>
                  typeof q === 'object' &&
                  q !== null &&
                  (q as { _id?: string })._id === 'generateTestRunStatsTestRunsStatsGet',
          ),
    });
  };

  return {
    list: {
      rows: (listQuery.data?.rows ?? []) as readonly ListItem[],
      total: listQuery.data?.total ?? 0,
      isLoading: listQuery.isLoading,
      error: (listQuery.error as Error | undefined)?.message ?? undefined,
    },
    stats: {
      data: stats,
      isLoading:
          statusQ.isLoading ||
          resultsQ.isLoading ||
          testSetsQ.isLoading ||
          executorsQ.isLoading,
      error:
          ((statusQ.error ||
              resultsQ.error ||
              testSetsQ.error ||
              executorsQ.error) as Error | undefined)?.message ?? undefined,
    },
    lookups: {
      users: (usersQ.data ?? []) as readonly LookupUser[],
      testSets: (testSetsLookupQ.data ?? []) as readonly LookupTestSet[],
      projects: (projectsQ.data ?? []) as readonly LookupProject[],
      endpoints: (endpointsQ.data ?? []) as readonly LookupEndpoint[],
      isLoading:
          usersQ.isLoading ||
          testSetsLookupQ.isLoading ||
          projectsQ.isLoading ||
          endpointsQ.isLoading,
      error:
          ((usersQ.error ||
              testSetsLookupQ.error ||
              projectsQ.error ||
              endpointsQ.error) as Error | undefined)?.message ?? undefined,
    },
    mutate: {
      deleteMany,
      createAndExecute,
      isPending:
          deleteMutation.isPending ||
          createConfigMutation.isPending ||
          executeConfigMutation.isPending,
    },
    invalidate: {
      list: invalidateList,
      stats: invalidateStats,
    },
  };
}
