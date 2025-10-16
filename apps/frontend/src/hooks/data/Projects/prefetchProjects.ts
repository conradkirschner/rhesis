import type { QueryClient } from '@tanstack/react-query';
import { readProjectsProjectsGetOptions } from '@/api-client/@tanstack/react-query.gen';

export async function prefetchProjects(
  queryClient: QueryClient,
  params: { readonly sessionToken: string; readonly baseUrl?: string },
) {
  const options = readProjectsProjectsGetOptions({
    headers: { Authorization: `Bearer ${params.sessionToken}` },
    baseUrl: params.baseUrl,
  });

  await queryClient.prefetchQuery({
    ...options,
    staleTime: 60_000,
  });

  return options.queryKey;
}