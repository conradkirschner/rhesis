import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  generateTestResultStatsTestResultsStatsGetOptions,
  generateTestStatsTestsStatsGetOptions,
  readTestSetsTestSetsGetOptions,
  readTestsTestsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import { lastNMonthsLabels, shapeMonthlyTotals, timelineDateLabel } from '../../../lib/dashboard/formatters';

type Params = {
  readonly months?: number;
  readonly top?: number;
  readonly recentCreated: { readonly skip: number; readonly limit: number };
  readonly recentUpdated: { readonly skip: number; readonly limit: number };
  readonly testSets: { readonly skip: number; readonly limit: number };
};

type UiTestRow = {
  readonly id: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly prompt: string;
  readonly ownerDisplayName: string;
  readonly updatedAt?: string;
  readonly createdAt?: string;
};

type UiTestSetRow = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly visibility: string;
};

type ChartsData = {
  readonly testCasesData: ReadonlyArray<{ readonly name: string; readonly total: number }>;
  readonly testExecutionTrendData: ReadonlyArray<{
    readonly name: string;
    readonly tests: number;
    readonly passed: number;
    readonly failed: number;
    readonly pass_rate: number;
  }>;
  readonly behaviorData: ReadonlyArray<{ readonly name: string; readonly value: number }>;
  readonly categoryData: ReadonlyArray<{ readonly name: string; readonly value: number }>;
};

export function useDashboardData(params: Params) {
  const months = params.months ?? 6;
  const top = params.top ?? 5;

  const testStatsQuery = useQuery(
    generateTestStatsTestsStatsGetOptions({
      query: { top, months },
      staleTime: 60_000,
    }),
  );

  const testResultsStatsQuery = useQuery(
    generateTestResultStatsTestResultsStatsGetOptions({
      query: { mode: 'timeline', months },
      staleTime: 60_000,
    }),
  );

  const recentCreatedQuery = useQuery(
    readTestsTestsGetOptions({
      query: {
        skip: params.recentCreated.skip,
        limit: params.recentCreated.limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      staleTime: 60_000,
    }),
  );

  const recentUpdatedQuery = useQuery(
    readTestsTestsGetOptions({
      query: {
        skip: params.recentUpdated.skip,
        limit: params.recentUpdated.limit,
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
      staleTime: 60_000,
    }),
  );

  const testSetsQuery = useQuery(
    readTestSetsTestSetsGetOptions({
      query: {
        skip: params.testSets.skip,
        limit: params.testSets.limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      staleTime: 60_000,
    }),
  );

  const charts: ChartsData = useMemo(() => {
    const monthLabels = lastNMonthsLabels(months);

    // Defaults when API has no data yet
    const defaultPieBehavior: ChartsData['behaviorData'] = [
      { name: 'Reliability', value: 1 },
      { name: 'Robustness', value: 1 },
      { name: 'Compliance', value: 1 },
    ];
    const defaultPieCategory: ChartsData['categoryData'] = [
      { name: 'Harmful', value: 1 },
      { name: 'Harmless', value: 1 },
      { name: 'Jailbreak', value: 1 },
    ];

    const ts = testStatsQuery.data?.stats;
    const total = (testStatsQuery.data as { total?: number } | undefined)?.total ?? 0;

    const monthlyCounts =
      (testStatsQuery.data as { history?: { monthly_counts?: Record<string, number> } } | undefined)
        ?.history?.monthly_counts ?? undefined;

    const testCasesData = monthlyCounts
      ? shapeMonthlyTotals(monthlyCounts, monthLabels, total)
      : monthLabels.map((m) => ({ name: m.label, total: 0 }));

    const behaviorData =
      ts?.behavior?.breakdown
        ? Object.entries(ts.behavior.breakdown)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a, b) => b.value - a.value)
        : defaultPieBehavior;

    const categoryData =
      ts?.category?.breakdown
        ? Object.entries(ts.category.breakdown)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a, b) => b.value - a.value)
        : defaultPieCategory;

    const timeline =
      (testResultsStatsQuery.data && 'timeline' in testResultsStatsQuery.data
        ? (testResultsStatsQuery.data as { timeline?: ReadonlyArray<any> }).timeline
        : []) ?? [];

    const testExecutionTrendData =
      timeline.length === 0
        ? monthLabels.map((m) => ({
            name: m.label,
            tests: 0,
            passed: 0,
            failed: 0,
            pass_rate: 0,
          }))
        : [...timeline]
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .map((item) => ({
              name: timelineDateLabel(String(item.date)),
              tests: item.overall?.total ?? 0,
              passed: item.overall?.passed ?? 0,
              failed: item.overall?.failed ?? 0,
              pass_rate: item.overall?.pass_rate ?? 0,
            }));

    return { testCasesData, testExecutionTrendData, behaviorData, categoryData };
  }, [months, testStatsQuery.data, testResultsStatsQuery.data]);

  const recentCreatedRows: ReadonlyArray<UiTestRow> = useMemo(() => {
    const src = (recentCreatedQuery.data as { data?: ReadonlyArray<any> } | undefined)?.data ?? [];
    return src.map((row) => {
      const owner = row.owner ?? {};
      const ownerName =
        owner.name ??
        [owner.given_name, owner.family_name].filter(Boolean).join(' ') ||
        owner.email ||
        'No contact info';
      return {
        id: String(row.id ?? row.nano_id ?? row.prompt?.content ?? `${row.created_at ?? ''}`),
        behaviorName: row.behavior?.name ?? 'Unspecified',
        topicName: row.topic?.name ?? 'Uncategorized',
        prompt: row.prompt?.content ?? 'No prompt',
        ownerDisplayName: ownerName,
        updatedAt: row.updated_at ?? undefined,
        createdAt: row.created_at ?? undefined,
      };
    });
  }, [recentCreatedQuery.data]);

  const recentUpdatedRows: ReadonlyArray<UiTestRow> = useMemo(() => {
    const src = (recentUpdatedQuery.data as { data?: ReadonlyArray<any> } | undefined)?.data ?? [];
    return src.map((row) => {
      const owner = row.owner ?? {};
      const ownerName =
        owner.name ??
        [owner.given_name, owner.family_name].filter(Boolean).join(' ') ||
        owner.email ||
        'No contact info';
      return {
        id: String(row.id ?? row.nano_id ?? row.prompt?.content ?? `${row.updated_at ?? ''}`),
        behaviorName: row.behavior?.name ?? 'Unspecified',
        topicName: row.topic?.name ?? 'Uncategorized',
        prompt: row.prompt?.content ?? 'No prompt',
        ownerDisplayName: ownerName,
        updatedAt: row.updated_at ?? undefined,
        createdAt: row.created_at ?? undefined,
      };
    });
  }, [recentUpdatedQuery.data]);

  const testSetRows: ReadonlyArray<UiTestSetRow> = useMemo(() => {
    const src = (testSetsQuery.data as { data?: ReadonlyArray<any> } | undefined)?.data ?? [];
    return src.map((row) => {
      const visibility = row.visibility
        ? String(row.visibility).charAt(0).toUpperCase() + String(row.visibility).slice(1)
        : row.is_published
          ? 'Public'
          : 'Private';
      return {
        id: String(row.id ?? row.nano_id ?? row.name),
        name: row.name ?? 'Unnamed',
        description: row.short_description ?? row.description ?? undefined,
        visibility,
      };
    });
  }, [testSetsQuery.data]);

  return {
    charts,
    chartsLoading: testStatsQuery.isLoading || testResultsStatsQuery.isLoading,
    chartsError:
      (testStatsQuery.error as Error | undefined)?.message ??
      (testResultsStatsQuery.error as Error | undefined)?.message ??
      null,

    recentCreated: {
      rows: recentCreatedRows,
      totalRows: (recentCreatedQuery.data as { pagination?: { totalCount?: number } } | undefined)
        ?.pagination?.totalCount ?? 0,
      loading: recentCreatedQuery.isLoading || recentCreatedQuery.isFetching,
      error: (recentCreatedQuery.error as Error | undefined)?.message ?? null,
    },

    recentUpdated: {
      rows: recentUpdatedRows,
      totalRows: (recentUpdatedQuery.data as { pagination?: { totalCount?: number } } | undefined)
        ?.pagination?.totalCount ?? 0,
      loading: recentUpdatedQuery.isLoading || recentUpdatedQuery.isFetching,
      error: (recentUpdatedQuery.error as Error | undefined)?.message ?? null,
    },

    testSets: {
      rows: testSetRows,
      totalRows: (testSetsQuery.data as { pagination?: { totalCount?: number } } | undefined)
        ?.pagination?.totalCount ?? 0,
      loading: testSetsQuery.isLoading || testSetsQuery.isFetching,
      error: (testSetsQuery.error as Error | undefined)?.message ?? null,
    },
  } as const;
}