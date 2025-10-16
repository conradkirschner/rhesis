import { QueryClient } from '@tanstack/react-query';
import {
  readTestsTestsGetOptions,
  generateTestStatsTestsStatsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

export type PrefetchTestsParams = {
  readonly skip?: number;
  readonly limit?: number;
  readonly sort_by?: string;
  readonly sort_order?: 'asc' | 'desc';
  readonly odataFilter?: string;
};

/** Server-side prefetch for Tests list + stats. */
export async function prefetchTests(qc: QueryClient, params: PrefetchTestsParams = {}) {
  const {
    skip = 0,
    limit = 25,
    sort_by = 'created_at',
    sort_order = 'desc',
    odataFilter,
  } = params;

  await qc.prefetchQuery(
    readTestsTestsGetOptions({
      query: {
        skip,
        limit,
        sort_by,
        sort_order,
        ...(odataFilter ? { $filter: odataFilter } : {}),
      },
    }),
  );

  const topMax = Math.max(5, 3, 5, 5);
  await qc.prefetchQuery(
    generateTestStatsTestsStatsGetOptions({
      query: { top: topMax, months: 1 },
    }),
  );
}