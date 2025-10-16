import { QueryClient } from '@tanstack/react-query';
import {
  readUsersUsersGetOptions,
  readStatusesStatusesGetOptions,
  readTypeLookupsTypeLookupsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

/** Prefetches datasets used by the Task Create feature. */
export async function prefetchTaskCreate(queryClient: QueryClient) {
  await Promise.all([
    queryClient.prefetchQuery({
      ...readUsersUsersGetOptions({ query: { limit: 200 } }),
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      ...readStatusesStatusesGetOptions({
        query: { entity_type: 'Task', sort_by: 'name', sort_order: 'asc' },
      }),
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      ...readTypeLookupsTypeLookupsGetOptions({
        query: {
          $filter: "type_name eq 'TaskPriority'",
          sort_by: 'type_value',
          sort_order: 'asc',
          limit: 100,
        },
      }),
      staleTime: 300_000,
    }),
  ]);
}