import { QueryClient } from '@tanstack/react-query';

/**
 * Prefetches data required by the Demo feature.
 * No remote data required for this feature currently.
 */
export async function prefetchDemo(_queryClient: QueryClient) {
  // Intentionally empty – no datasets to prefetch.
}