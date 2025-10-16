import type { QueryClient } from '@tanstack/react-query';
import { prefetchGenerateTests as _prefetch } from './useGenerateTestsData';

export async function prefetchGenerateTests(queryClient: QueryClient) {
  await _prefetch(queryClient);
}