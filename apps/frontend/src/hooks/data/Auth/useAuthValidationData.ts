import { useMutation, useQuery, QueryKey } from '@tanstack/react-query';
import { getClientApiBaseUrl } from '@/utils/url-resolver';

type VerifyResponse = {
  readonly authenticated: boolean;
  readonly user?: { readonly id: string; readonly name?: string } | null;
};

const authKeys = {
  root: ['auth'] as const,
  verify: (token: string) => ['auth', 'verify', token] as const,
};

async function verifySession(token: string): Promise<VerifyResponse> {
  const res = await fetch(
    `${getClientApiBaseUrl()}/auth/verify?session_token=${encodeURIComponent(token)}`,
    { headers: { Accept: 'application/json' }, credentials: 'include' }
  );
  if (!res.ok) return { authenticated: false, user: null };
  const data = (await res.json()) as VerifyResponse;
  return { authenticated: Boolean(data.authenticated), user: data.user ?? null };
}

async function logoutBackend(): Promise<void> {
  await fetch(`${getClientApiBaseUrl()}/auth/logout`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  }).catch(() => undefined);
}

export function useAuthValidationData(input: {
  readonly sessionToken?: string | null;
  readonly enabled?: boolean;
}) {
  const token = input.sessionToken ?? '';
  const enabled = Boolean(input.enabled && token.length > 0);

  const query = useQuery({
    queryKey: authKeys.verify(token) as QueryKey,
    queryFn: () => verifySession(token),
    enabled,
    staleTime: 60_000,
  });

  const logout = useMutation({ mutationFn: logoutBackend });

  return {
    backendSessionValid:
      query.data?.authenticated ?? (query.isPending ? null : false),
    verifyData: query.data ?? null,
    isVerifying: query.isPending,
    verifyError: query.error ?? null,
    refetchVerify: query.refetch,
    logoutBackend: logout.mutateAsync,
    isLoggingOut: logout.isPending,
  };
}

export { authKeys, verifySession, logoutBackend };