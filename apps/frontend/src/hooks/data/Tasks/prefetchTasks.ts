import type { QueryClient } from '@tanstack/react-query';
import { listTasksTasksGetOptions } from '@/api-client/@tanstack/react-query.gen';

export interface PrefetchTasksInput {
  readonly skip: number;
  readonly limit: number;
  readonly filter?: string;
  readonly headers?: Record<string, string>;
}

/**
 * Prefetches the tasks list for SSR hydration.
 */
export async function prefetchTasks(
  qc: QueryClient,
  { skip, limit, filter, headers }: PrefetchTasksInput,
): Promise<void> {
  await qc.prefetchQuery({
    ...listTasksTasksGetOptions({
      headers,
      query: { skip, limit, $filter: filter },
    }),
    staleTime: 60_000,
  });
}