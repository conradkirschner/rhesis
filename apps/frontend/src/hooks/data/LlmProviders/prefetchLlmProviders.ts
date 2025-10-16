import { QueryClient } from '@tanstack/react-query';
import {
  readModelsModelsGetOptions,
  readTypeLookupsTypeLookupsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

/** Prefetches LLM providers and connected models for SSR. */
export async function prefetchLlmProviders(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.prefetchQuery({
      ...readTypeLookupsTypeLookupsGetOptions({
        query: { $filter: "type_name eq 'ProviderType'" },
      }),
      staleTime: 5 * 60_000,
    }),
    queryClient.prefetchQuery({
      ...readModelsModelsGetOptions(),
      staleTime: 60_000,
    }),
  ]);
}