import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  readEndpointsEndpointsGetOptions,
  readProjectsProjectsGetOptions,
  deleteEndpointEndpointsEndpointIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

type PlainEndpoint = {
  readonly id: string;
  readonly name: string;
  readonly protocol: string;
  readonly environment: string;
  readonly project_id?: string;
};

type PlainProject = {
  readonly id: string;
  readonly name: string;
  readonly icon?: string | null;
};

export interface UseEndpointsDataParams {
  readonly page: number;
  readonly pageSize: number;
  readonly enabled?: boolean;
}

export interface UseEndpointsDataResult {
  readonly endpoints: readonly PlainEndpoint[];
  readonly totalCount: number;
  readonly projectsById: Readonly<Record<string, PlainProject>>;
  readonly isLoading: boolean;
  readonly error: string | null;
  deleteEndpoints(ids: readonly string[]): Promise<void>;
}

/** Fetches endpoints + projects and exposes a delete action with precise invalidation. */
export function useEndpointsData(params: UseEndpointsDataParams): UseEndpointsDataResult {
  const { page, pageSize, enabled = true } = params;
  const queryClient = useQueryClient();

  const skip = page * pageSize;
  const limit = pageSize;

  const endpointsOptions = useMemo(
    () =>
      readEndpointsEndpointsGetOptions({
        query: { skip, limit, sort_by: 'created_at', sort_order: 'desc' },
      }),
    [skip, limit],
  );

  const projectsOptions = useMemo(
    () =>
      readProjectsProjectsGetOptions({
        query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
      }),
    [],
  );

  const {
    data: endpointsData,
    isLoading: loadingEndpoints,
    error: endpointsError,
  } = useQuery({
    ...endpointsOptions,
    enabled,
    staleTime: 60_000,
  });

  const {
    data: projectsData,
    isLoading: loadingProjects,
    error: projectsError,
  } = useQuery({
    ...projectsOptions,
    enabled,
    staleTime: 300_000,
  });

  const deleteMutation = useMutation({
    ...deleteEndpointEndpointsEndpointIdDeleteMutation(),
  });

  const endpoints: readonly PlainEndpoint[] =
    (endpointsData?.data ?? []).map((e) => ({
      id: e.id!,
      name: e.name ?? '',
      protocol: e.protocol!,
      environment: e.environment!,
      project_id: e.project_id ?? undefined,
    })) ?? [];

  const totalCount = endpointsData?.pagination.totalCount ?? 0;

  const projectsById: Readonly<Record<string, PlainProject>> = useMemo(() => {
    const map: Record<string, PlainProject> = {};
    for (const p of projectsData?.data ?? []) {
      if (p.id) map[p.id] = { id: p.id, name: p.name ?? '', icon: p.icon ?? null };
    }
    return map;
  }, [projectsData]);

  const error =
    endpointsError?.message ??
    projectsError?.message ??
    null;

  const deleteEndpoints = async (ids: readonly string[]) => {
    if (ids.length === 0) return;
    await Promise.all(
      ids.map((id) => deleteMutation.mutateAsync({ path: { endpoint_id: id } })),
    );
    await queryClient.invalidateQueries({ queryKey: endpointsOptions.queryKey });
  };

  return {
    endpoints,
    totalCount,
    projectsById,
    isLoading: loadingEndpoints || loadingProjects || deleteMutation.isPending,
    error,
    deleteEndpoints,
  };
}