import { type QueryClient } from '@tanstack/react-query';
import { readUserUsersUserIdGetOptions } from '@/api-client/@tanstack/react-query.gen';

type PrefetchArgs = Readonly<{
  queryClient: QueryClient;
  ownerId?: string;
}>;

/** Prefetch primary datasets for CreateProject (owner). */
export async function prefetchCreateProject({ queryClient, ownerId }: PrefetchArgs) {
  if (!ownerId) return;
  const options = readUserUsersUserIdGetOptions({
    path: { user_id: String(ownerId) },
  });
  await queryClient.prefetchQuery({
    ...options,
    staleTime: 60_000,
  });
}