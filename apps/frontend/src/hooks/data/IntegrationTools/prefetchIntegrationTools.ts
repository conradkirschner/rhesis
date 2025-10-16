import type { QueryClient } from '@tanstack/react-query';

/**
 * No-op prefetch for Integration Tools (no queries yet).
 */
export async function prefetchIntegrationTools(_queryClient: QueryClient) {
  // Intentionally empty: this feature has no data dependencies yet.
}