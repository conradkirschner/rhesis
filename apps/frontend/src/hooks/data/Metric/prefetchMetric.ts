import { QueryClient } from '@tanstack/react-query';
import {
  readMetricMetricsMetricIdGetOptions,
  readModelsModelsGetOptions,
  readStatusesStatusesGetOptions,
  readUsersUsersGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

/** Prefetches Metric detail and lookups for SSR hydration. */
export async function prefetchMetric(qc: QueryClient, metricId: string) {
  await Promise.all([
    qc.prefetchQuery({
      ...readMetricMetricsMetricIdGetOptions({ path: { metric_id: metricId } }),
      staleTime: 60_000,
    }),
    qc.prefetchQuery({
      ...readModelsModelsGetOptions({ query: { limit: 100, skip: 0 } }),
      staleTime: 300_000,
    }),
    qc.prefetchQuery({
      ...readStatusesStatusesGetOptions({
        query: { entity_type: 'Metric', sort_by: 'name', sort_order: 'asc' },
      }),
      staleTime: 300_000,
    }),
    qc.prefetchQuery({
      ...readUsersUsersGetOptions({ query: { limit: 100, skip: 0 } }),
      staleTime: 300_000,
    }),
  ]);
}