import { QueryClient } from '@tanstack/react-query';
import {
  generateTestStatsTestsStatsGetOptions,
  generateTestResultStatsTestResultsStatsGetOptions,
  readTestsTestsGetOptions,
  readTestSetsTestSetsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import { DASHBOARD_MONTHS } from './useDashboardData';

const SIXTY_SECONDS = 60_000;
const FIVE_MINUTES = 5 * 60_000;

/** Prefetches all dashboard datasets for SSR. */
export async function prefetchDashboard(client: QueryClient, opts?: { pageSize?: number }) {
  const limit = opts?.pageSize ?? 10;
  const skip = 0;
  const months = DASHBOARD_MONTHS;

  await Promise.all([
    client.ensureQueryData({
      ...generateTestStatsTestsStatsGetOptions({ query: { top: 5, months } }),
      staleTime: SIXTY_SECONDS,
    }),
    client.ensureQueryData({
      ...generateTestResultStatsTestResultsStatsGetOptions({
        query: { mode: 'timeline', months },
      }),
      staleTime: SIXTY_SECONDS,
    }),
    client.ensureQueryData({
      ...readTestsTestsGetOptions({
        query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
      }),
      staleTime: SIXTY_SECONDS,
      gcTime: FIVE_MINUTES,
    }),
    client.ensureQueryData({
      ...readTestsTestsGetOptions({
        query: { skip, limit, sort_by: 'updated_at', sort_order: 'desc' },
      }),
      staleTime: SIXTY_SECONDS,
      gcTime: FIVE_MINUTES,
    }),
    client.ensureQueryData({
      ...readTestSetsTestSetsGetOptions({
        query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
      }),
      staleTime: SIXTY_SECONDS,
      gcTime: FIVE_MINUTES,
    }),
  ]);
}