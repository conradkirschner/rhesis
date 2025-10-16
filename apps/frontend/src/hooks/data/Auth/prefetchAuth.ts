import { QueryClient } from '@tanstack/react-query';
import { authKeys, verifySession } from './useAuthValidationData';

export async function prefetchAuth(client: QueryClient, sessionToken: string) {
  if (!sessionToken) return;
  await client.prefetchQuery({
    queryKey: authKeys.verify(sessionToken),
    queryFn: () => verifySession(sessionToken),
    staleTime: 60_000,
  });
}