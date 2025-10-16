import { QueryClient } from '@tanstack/react-query';
import { readTokensTokensGetOptions } from '@/api-client/@tanstack/react-query.gen';

type SortOrder = 'asc' | 'desc';

type PrefetchParams = {
  readonly skip: number;
  readonly limit: number;
  readonly sort_by?: 'created_at';
  readonly sort_order?: SortOrder;
};

/** Prefetch Tokens list for SSR. */
export async function prefetchTokens(qc: QueryClient, params: PrefetchParams) {
  const options = readTokensTokensGetOptions({
    query: {
      skip: params.skip,
      limit: params.limit,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
    },
  });
  await qc.prefetchQuery({ ...options, staleTime: 60_000 });
  return options.queryKey;
}