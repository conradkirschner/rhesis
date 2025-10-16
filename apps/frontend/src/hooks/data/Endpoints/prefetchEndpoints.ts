import type { QueryClient } from '@tanstack/react-query';
import {
  readEndpointsEndpointsGetOptions,
  readProjectsProjectsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

export interface PrefetchEndpointsParams {
  readonly page: number;
  readonly pageSize: number;
}

/** Server-side prefetch for endpoints and lookups. */
export async function prefetchEndpoints(queryClient: QueryClient, params: PrefetchEndpointsParams) {
  const { page, pageSize } = params;
  const skip = page * pageSize;
  const limit = pageSize;

  const endpointsOpts = readEndpointsEndpointsGetOptions({
    query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
  });

  const projectsOpts = readProjectsProjectsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
  });

  await Promise.all([
    queryClient.prefetchQuery({ ...endpointsOpts, staleTime: 60_000 }),
    queryClient.prefetchQuery({ ...projectsOpts, staleTime: 300_000 }),
  ]);
}