import type { QueryClient } from '@tanstack/react-query';
import { readProjectsProjectsGetOptions } from '@/api-client/@tanstack/react-query.gen';

/** Prefetch datasets used by the Swagger Endpoint page. */
export async function prefetchSwaggerEndpoint(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    ...readProjectsProjectsGetOptions({
      query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
    staleTime: 5 * 60 * 1000,
  });
}