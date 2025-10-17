import { useQuery } from '@tanstack/react-query';
import { readTokensTokensGetOptions } from '@/api-client/@tanstack/react-query.gen';

/** The /tokens endpoint may return either a paginated envelope or a bare array. */

type TokenDto = {
  id?: string | null;
  name?: string | null;
  created_at?: string | null;
  revoked_at?: string | null;
  [k: string]: string | number | boolean | null | undefined;
};

type TokensEnvelope = {
  data?: readonly TokenDto[] | null;
  pagination?: { totalCount?: number | null } | null;
};

type TokensResponse = TokensEnvelope | readonly TokenDto[];

function isEnvelope(payload: TokensResponse): payload is TokensEnvelope {
  return !Array.isArray(payload);
}

function getItems(payload: TokensResponse): readonly TokenDto[] {
  return isEnvelope(payload) ? payload.data ?? [] : payload;
}

function getTotal(payload: TokensResponse): number {
  return isEnvelope(payload) ? payload.pagination?.totalCount ?? 0 : payload.length;
}

export function useTokensData() {
  const query = useQuery({
    ...readTokensTokensGetOptions(),
    staleTime: 60_000,
    select: (payload: TokensResponse) => ({
      rows: getItems(payload),
      total: getTotal(payload),
    }),
  });

  return {
    rows: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.isError ? (query.error as Error).message : undefined,
    refetch: query.refetch,
  } as const;
}
