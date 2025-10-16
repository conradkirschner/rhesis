import { useQuery } from '@tanstack/react-query';
import { readProjectsProjectsGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type { ProjectDetail } from '@/api-client/types.gen';

export type ProjectsListItem = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly isActive?: boolean;
  readonly icon?: string | null;
  readonly createdAt?: string | null;
  readonly owner?: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly picture?: string | null;
  } | null;
};

export type UseProjectsDataParams = {
  readonly sessionToken: string;
  readonly baseUrl?: string;
};

export function useProjectsData({ sessionToken, baseUrl }: UseProjectsDataParams) {
  const options = readProjectsProjectsGetOptions({
    headers: { Authorization: `Bearer ${sessionToken}` },
    baseUrl,
  });

  const query = useQuery({
    ...options,
    staleTime: 60_000,
  });

  const apiItems = (query.data?.data ?? []) as ReadonlyArray<ProjectDetail>;

  const projects: ReadonlyArray<ProjectsListItem> = apiItems.map((p) => ({
    id: String(p.id ?? ''),
    name: p.name ?? '',
    description: p.description ?? undefined,
    isActive: p.is_active ?? undefined,
    icon: (p as { icon?: string | null }).icon ?? null,
    createdAt: (p as { created_at?: string | null }).created_at ?? null,
    owner: (p as { owner?: { name?: string | null; email?: string | null; picture?: string | null } | null }).owner ?? null,
  }));

  return {
    projects,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: (query.error as Error | undefined)?.message ?? undefined,
    refetch: query.refetch,
    queryKey: options.queryKey,
  };
}