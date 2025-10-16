import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  generateTestStatsTestsStatsGetOptions,
  generateTestResultStatsTestResultsStatsGetOptions,
  readTestsTestsGetOptions,
  readTestSetsTestSetsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import { createMonthlyData, getLastNMonths } from '@/lib/dashboard/chartUtils';
import { formatTimelineDate } from '@/lib/dashboard/formatters';

const SIXTY_SECONDS = 60_000;
const FIVE_MINUTES = 5 * 60_000;
export const DASHBOARD_MONTHS = 6;

type TestRow = {
  readonly id: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly promptContent?: string;
  readonly updatedAt?: string;
  readonly assigneeDisplay?: string;
  readonly ownerDisplay?: string;
};

type TestSetRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly visibility: string;
};

type PieSlice = { readonly name: string; readonly value: number };
type TrendPoint = {
  readonly name: string;
  readonly tests: number;
  readonly passed: number;
  readonly failed: number;
  readonly pass_rate: number;
};

export function useDashboardChartsData() {
  const months = DASHBOARD_MONTHS;

  const testStatsQuery = useQuery({
    ...generateTestStatsTestsStatsGetOptions({ query: { top: 5, months } }),
    staleTime: SIXTY_SECONDS,
  });

  const resultStatsQuery = useQuery({
    ...generateTestResultStatsTestResultsStatsGetOptions({
      query: { mode: 'timeline', months },
    }),
    staleTime: SIXTY_SECONDS,
  });

  const isLoading = testStatsQuery.isLoading || resultStatsQuery.isLoading;
  const errorMessage =
    (testStatsQuery.error as Error | undefined)?.message ??
    (resultStatsQuery.error as Error | undefined)?.message ??
    null;

  const defaultDimBehavior: readonly PieSlice[] = [
    { name: 'Reliability', value: 1 },
    { name: 'Robustness', value: 1 },
    { name: 'Compliance', value: 1 },
  ] as const;

  const defaultDimCategory: readonly PieSlice[] = [
    { name: 'Harmful', value: 1 },
    { name: 'Harmless', value: 1 },
    { name: 'Jailbreak', value: 1 },
  ] as const;

  const lastMonthsLabels = getLastNMonths(months);

  const categoryData: readonly PieSlice[] = useMemo(() => {
    const breakdown = testStatsQuery.data?.stats?.category?.breakdown;
    if (!breakdown) return defaultDimCategory;
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [testStatsQuery.data]);

  const behaviorData: readonly PieSlice[] = useMemo(() => {
    const breakdown = testStatsQuery.data?.stats?.behavior?.breakdown;
    if (!breakdown) return defaultDimBehavior;
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [testStatsQuery.data]);

  const testCasesData = useMemo(() => {
    const monthlyCounts = testStatsQuery.data?.history?.monthly_counts as
      | Record<string, number>
      | undefined;

    if (monthlyCounts) {
      const series = createMonthlyData(monthlyCounts, lastMonthsLabels);
      const series_copy = [...series]
      if (series_copy.length > 0) {
        const last = series_copy[series_copy.length - 1];
        const total = Number(testStatsQuery.data?.total ?? 0);
        if (last.total < total) {
          // ensure cumulative series ends at current total
          series_copy[series_copy.length - 1] = { ...last, total };
        }
      }
      return series_copy;
    }

    return [{ name: 'Current Total', total: Number(testStatsQuery.data?.total ?? 0) }] as const;
  }, [testStatsQuery.data, lastMonthsLabels]);

  const testExecutionTrendData: readonly TrendPoint[] = useMemo(() => {
    const timeline =
      'timeline' in (resultStatsQuery.data ?? {}) ? (resultStatsQuery.data as any).timeline : [];
    if (!timeline || timeline.length === 0) {
      // default flat trend
      return lastMonthsLabels.map((name) => ({
        name,
        tests: 0,
        passed: 0,
        failed: 0,
        pass_rate: 0,
      }));
    }
    return [...timeline]
      .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)))
      .map((item: any) => ({
        name: formatTimelineDate(String(item.date)),
        tests: Number(item.overall?.total ?? 0),
        passed: Number(item.overall?.passed ?? 0),
        failed: Number(item.overall?.failed ?? 0),
        pass_rate: Number(item.overall?.pass_rate ?? 0),
      }));
  }, [resultStatsQuery.data, lastMonthsLabels]);

  return {
    isLoading,
    errorMessage,
    testCasesData,
    testExecutionTrendData,
    behaviorData,
    categoryData,
  };
}

function displayName(person?: {
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  email?: string | null;
}): string {
  if (!person) return 'Unassigned';
  if (person.name) return person.name;
  const full = [person.given_name, person.family_name].filter(Boolean).join(' ').trim();
  return full || person.email || 'Unknown';
}

export function useRecentTestsData(params: { skip: number; limit: number }) {
  const { skip, limit } = params;

  const q = useQuery({
    ...readTestsTestsGetOptions({
      query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
    }),
    staleTime: SIXTY_SECONDS,
    gcTime: FIVE_MINUTES,
  });

  const rows: readonly TestRow[] =
    q.data?.data?.map((row: any) => ({
      id: String(row.id ?? row.nano_id ?? `${row.prompt?.content ?? 'row'}-${row.created_at ?? ''}`),
      behaviorName: row.behavior?.name ?? 'Unspecified',
      topicName: row.topic?.name ?? 'Uncategorized',
      promptContent: row.prompt?.content ?? 'No prompt',
      ownerDisplay: displayName(row.owner) || 'No owner',
    })) ?? [];

  const totalRows = Number(q.data?.pagination?.totalCount ?? 0);

  return {
    rows,
    totalRows,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    errorMessage: (q.error as Error | undefined)?.message ?? null,
  };
}

export function useRecentActivitiesData(params: { skip: number; limit: number }) {
  const { skip, limit } = params;

  const q = useQuery({
    ...readTestsTestsGetOptions({
      query: { skip, limit, sort_by: 'updated_at', sort_order: 'desc' },
    }),
    staleTime: SIXTY_SECONDS,
    gcTime: FIVE_MINUTES,
  });

  const rows: readonly TestRow[] =
    q.data?.data?.map((row: any) => ({
      id: String(row.id ?? row.nano_id ?? `${row.prompt?.content ?? 'row'}-${row.updated_at ?? ''}`),
      behaviorName: row.behavior?.name ?? 'Unspecified',
      topicName: row.topic?.name ?? 'Uncategorized',
      updatedAt: row.updated_at ?? '',
      assigneeDisplay: displayName(row.assignee),
    })) ?? [];

  const totalRows = Number(q.data?.pagination?.totalCount ?? 0);

  return {
    rows,
    totalRows,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    errorMessage: (q.error as Error | undefined)?.message ?? null,
  };
}

export function useRecentTestSetsData(params: { skip: number; limit: number }) {
  const { skip, limit } = params;

  const q = useQuery({
    ...readTestSetsTestSetsGetOptions({
      query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
    }),
    staleTime: SIXTY_SECONDS,
    gcTime: FIVE_MINUTES,
  });

  const rows: readonly TestSetRow[] =
    q.data?.data?.map((row: any) => ({
      id: String(row.id ?? row.nano_id ?? `${row.name}`),
      name: row.name ?? '',
      description: row.short_description ?? row.description ?? 'No description',
      visibility: row.visibility
        ? `${String(row.visibility).charAt(0).toUpperCase()}${String(row.visibility).slice(1)}`
        : row.is_published
        ? 'Public'
        : 'Private',
    })) ?? [];

  const totalRows = Number(q.data?.pagination?.totalCount ?? 0);

  return {
    rows,
    totalRows,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    errorMessage: (q.error as Error | undefined)?.message ?? null,
  };
}