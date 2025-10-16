import { QueryClient } from '@tanstack/react-query';
import {
  readTestRunsTestRunsGetOptions,
  generateTestRunStatsTestRunsStatsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

/** Prefetch first page of list + charts for SSR. */
export async function prefetchTestRuns(qc: QueryClient, params: { page: number; pageSize: number }) {
  const skip = params.page * params.pageSize;
  const limit = params.pageSize;

  await Promise.all([
    qc.prefetchQuery({
      ...readTestRunsTestRunsGetOptions({
        query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
      }),
      staleTime: 60_000,
    }),
    qc.prefetchQuery({
      ...generateTestRunStatsTestRunsStatsGetOptions({
        query: { mode: 'status', top: 5, months: 6 },
      }),
      staleTime: 60_000,
    }),
    qc.prefetchQuery({
      ...generateTestRunStatsTestRunsStatsGetOptions({
        query: { mode: 'results', top: 5, months: 6 },
      }),
      staleTime: 60_000,
    }),
    qc.prefetchQuery({
      ...generateTestRunStatsTestRunsStatsGetOptions({
        query: { mode: 'test_sets', top: 5, months: 6 },
      }),
      staleTime: 60_000,
    }),
    qc.prefetchQuery({
      ...generateTestRunStatsTestRunsStatsGetOptions({
        query: { mode: 'executors', top: 5, months: 6 },
      }),
      staleTime: 60_000,
    }),
  ]);
}