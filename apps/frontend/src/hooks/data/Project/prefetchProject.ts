import { QueryClient } from '@tanstack/react-query';
import { readProjectProjectsProjectIdGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface Params {
  readonly projectId: string;
  readonly sessionToken: string;
  readonly baseUrl?: string;
}

/** Prefetch Project for SSR hydration. */
export async function prefetchProject(queryClient: QueryClient, params: Params): Promise<void> {
  const { projectId, sessionToken, baseUrl = process.env.BACKEND_URL } = params;

  const options = readProjectProjectsProjectIdGetOptions({
    path: { project_id: projectId },
    baseUrl,
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  await queryClient.ensureQueryData({
    ...options,
    staleTime: 60_000,
  });
}