import type { QueryClient } from '@tanstack/react-query';
import { readModelsModelsGetOptions } from '@/api-client/@tanstack/react-query.gen';

export async function prefetchMetrics(qc: QueryClient) {
  const getModels = readModelsModelsGetOptions({
    query: { sort_by: 'name', sort_order: 'asc', skip: 0, limit: 100 },
  });
  await qc.prefetchQuery({ ...getModels, staleTime: 5 * 60 * 1000 });
}