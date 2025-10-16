import { useMemo } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  readTokensTokensGetOptions,
  createTokenTokensPostMutation,
  refreshTokenTokensTokenIdRefreshPostMutation,
  deleteTokenTokensTokenIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

type SortOrder = 'asc' | 'desc';

type ListParams = {
  readonly skip: number;
  readonly limit: number;
  readonly sort_by?: 'created_at';
  readonly sort_order?: SortOrder;
};

type TokenItem = {
  readonly id: string;
  readonly name: string;
  readonly token_obfuscated: string;
  readonly last_used_at: string | null;
  readonly expires_at: string | null;
};

type TokensListEnvelope = {
  readonly data: readonly TokenItem[];
  readonly pagination?: { readonly totalCount?: number | null } | null;
};

function coerceList(
  payload: TokensListEnvelope | readonly TokenItem[] | null | undefined,
): readonly TokenItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

function coerceTotal(
  payload: TokensListEnvelope | readonly TokenItem[] | null | undefined,
): number {
  if (!payload || Array.isArray(payload)) return 0;
  return payload.pagination?.totalCount ?? 0;
}

/**
 * Fetch and mutate Tokens. Returns plain serializable shapes and fns.
 */
export function useTokensData(params: ListParams) {
  const qc = useQueryClient();

  const options = useMemo(
    () =>
      readTokensTokensGetOptions({
        query: {
          skip: params.skip,
          limit: params.limit,
          sort_by: params.sort_by ?? 'created_at',
          sort_order: params.sort_order ?? 'desc',
        },
      }),
    [params.limit, params.skip, params.sort_by, params.sort_order],
  );

  const listQuery = useQuery({
    ...options,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const tokensEnvelope = listQuery.data as TokensListEnvelope | readonly TokenItem[] | undefined;

  const tokens = coerceList(tokensEnvelope);
  const totalCount = coerceTotal(tokensEnvelope);

  const invalidateList = async () => {
    await qc.invalidateQueries({ queryKey: options.queryKey });
  };

  const createMutation = useMutation({
    ...createTokenTokensPostMutation(),
    onSuccess: invalidateList,
  });

  const refreshMutation = useMutation({
    ...refreshTokenTokensTokenIdRefreshPostMutation(),
    onSuccess: invalidateList,
  });

  const deleteMutation = useMutation({
    ...deleteTokenTokensTokenIdDeleteMutation(),
    onSuccess: invalidateList,
  });

  const createToken = async (name: string, expiresInDays: number | null) => {
    return createMutation.mutateAsync({ body: { name, expires_in_days: expiresInDays } });
  };

  const refreshToken = async (tokenId: string, expiresInDays: number | null) => {
    return refreshMutation.mutateAsync({
      path: { token_id: tokenId },
      body: { expires_in_days: expiresInDays },
    });
  };

  const deleteToken = async (tokenId: string) => {
    await deleteMutation.mutateAsync({ path: { token_id: tokenId } });
  };

  return {
    tokens,
    totalCount,
    isLoading: listQuery.isFetching,
    error: (listQuery.error as Error | null)?.message ?? null,
    refetch: listQuery.refetch,
    createToken,
    refreshToken,
    deleteToken,
    queryKey: options.queryKey,
  };
}