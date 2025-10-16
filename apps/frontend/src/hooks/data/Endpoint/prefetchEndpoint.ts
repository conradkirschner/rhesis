import type { QueryClient } from '@tanstack/react-query';
import {
  readEndpointEndpointsEndpointIdGetOptions,
  readProjectsProjectsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

export async function prefetchEndpoint(
  queryClient: QueryClient,
  { identifier }: { identifier: string },
) {
  const endpointQuery = readEndpointEndpointsEndpointIdGetOptions({
    path: { endpoint_id: identifier },
  });
  const projectsQuery = readProjectsProjectsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
  });

  await queryClient.prefetchQuery({ ...endpointQuery, staleTime: 60_000 });
  await queryClient.prefetchQuery({ ...projectsQuery, staleTime: 300_000 });
}