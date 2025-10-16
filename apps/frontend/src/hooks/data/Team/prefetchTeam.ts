import type { QueryClient } from '@tanstack/react-query';
import { readUsersUsersGetOptions } from '@/api-client/@tanstack/react-query.gen';

/**
 * Prefetch initial team members page.
 */
export async function prefetchTeam(queryClient: QueryClient, params?: { skip?: number; limit?: number }) {
  const skip = params?.skip ?? 0;
  const limit = params?.limit ?? 25;

  const opts = readUsersUsersGetOptions({
    query: { skip, limit },
  });

  await queryClient.prefetchQuery({
    ...opts,
    staleTime: 60_000,
  });
}