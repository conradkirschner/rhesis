import type { QueryClient } from '@tanstack/react-query';

/** No-op prefetch: onboarding uses only mutations. */
export async function prefetchOnboarding(_queryClient: QueryClient): Promise<void> {
  return;
}