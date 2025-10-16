import { QueryClient } from '@tanstack/react-query';
import {
  generateTestResultStatsTestResultsStatsGetOptions,
  generateTestStatsTestsStatsGetOptions,
  readTestSetsTestSetsGetOptions,
  readTestsTestsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

type PrefetchParams = {
  readonly months?: number;
  readonly top?: number;
  readonly recentCreated: { readonly skip: number; readonly limit: number };
  readonly recentUpdated: { readonly skip: number; readonly limit: number };
  readonly testSets: { readonly skip: number; readonly limit: number };
};

/** Prefetches all datasets needed for the Dashboard page. */
export async function prefetchDashboard(queryClient: QueryClient, params: PrefetchParams) {
  const months = params.months ?? 6;
  const top = params.top ?? 5;

  await Promise.all([
    queryClient.prefetchQuery(
      generateTestStatsTestsStatsGetOptions({
        query: { top, months },
        staleTime: 60_000,
      }),
    ),
    queryClient.prefetchQuery(
      generateTestResultStatsTestResultsStatsGetOptions({
        query: { mode: 'timeline', months },
        staleTime: 60_000,
      }),
    ),
    queryClient.prefetchQuery(
      readTestsTestsGetOptions({
        query: {
          skip: params.recentCreated.skip,
          limit: params.recentCreated.limit,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
        staleTime: 60_000,
      }),
    ),
    queryClient.prefetchQuery(
      readTestsTestsGetOptions({
        query: {
          skip: params.recentUpdated.skip,
          limit: params.recentUpdated.limit,
          sort_by: 'updated_at',
          sort_order: 'desc',
        },
        staleTime: 60_000,
      }),
    ),
    queryClient.prefetchQuery(
      readTestSetsTestSetsGetOptions({
        query: {
          skip: params.testSets.skip,
          limit: params.testSets.limit,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
        staleTime: 60_000,
      }),
    ),
  ]);
}