import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query';
import {
  readEndpointsEndpointsGetOptions,
  readProjectsProjectsGetOptions,
  deleteEndpointEndpointsEndpointIdDeleteMutation,
  createEndpointEndpointsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import type { CreateEndpointEndpointsPostData, JsonInput } from '@/api-client';
import type { ProjectDetail } from '@/api-client/types.gen';
import {CreateEndpointInput, ProjectSummary } from '@/domain/endpoints/types';
import {parseJsonMap, parseStringMap } from '@/lib/endpoints/json';


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

  /** Projects exposed both as array and by-id map for convenience */
  readonly projects: readonly ProjectSummary[];
  readonly projectsById: Readonly<Record<string, PlainProject>>;

  /** Loading/Error states split out for containers that need them */
  readonly isLoading: boolean;
  readonly isLoadingProjects: boolean;
  readonly isLoadingEndpoints: boolean;

  readonly projectsError: unknown | null;
  readonly endpointsError: unknown | null;
  readonly error: string | null;

  /** Mutations */
  createEndpoint(input: CreateEndpointInput): Promise<void>;
  readonly isCreating: boolean;
  readonly createError: unknown | null;

  deleteEndpoints(ids: readonly string[]): Promise<void>;
}

/** Local shaper to keep UI types decoupled from API types */
function shapeProjects(
    data: readonly ProjectDetail[] | undefined,
): readonly ProjectSummary[] {
  if (!data) return [];
  return data.map((p) => {
    const name: string = p.name ?? ''; // ensure non-nullable per ProjectSummary
    return {
      id: p.id!, // assert present; API contracts guarantee id
      name,
      description: p.description ?? null,
      // icon is not guaranteed on all backends; cast to read if present
      icon: (p as unknown as { icon?: string | null })?.icon ?? null,
    } satisfies ProjectSummary;
  });
}

/** Fetches endpoints + projects and exposes create/delete with precise invalidation. */
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

  // ---------- Queries ----------
  const {
    data: endpointsData,
    isLoading: isLoadingEndpoints,
    error: endpointsError,
  } = useQuery({
    ...endpointsOptions,
    enabled,
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    ...projectsOptions,
    enabled,
    select: (res) => shapeProjects(res.data),
    staleTime: 300_000,
  });

  // ---------- Mutations ----------
  const createMutation = useMutation({
    ...createEndpointEndpointsPostMutation(),
  });

  async function createEndpoint(input: CreateEndpointInput): Promise<void> {
    const body: CreateEndpointEndpointsPostData['body'] = {
      name: input.name,
      description: input.description,
      protocol: input.protocol,
      url: input.url,
      environment: input.environment,
      config_source: input.config_source,
      response_format: input.response_format,
      method: input.method,
      endpoint_path: input.endpoint_path,
      project_id: input.project_id || undefined,
      request_headers: parseStringMap(input.request_headers),
      response_mappings: parseStringMap(input.response_mappings),
      request_body_template: parseJsonMap(
          input.request_body_template,
      ) as unknown as { [key: string]: JsonInput } | null,
    };
    await createMutation.mutateAsync({ body });
    // Invalidate endpoints so lists reflect the new item
    await queryClient.invalidateQueries({ queryKey: endpointsOptions.queryKey });
  }

  const deleteMutation = useMutation({
    ...deleteEndpointEndpointsEndpointIdDeleteMutation(),
  });

  // ---------- Projections ----------
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
    for (const p of projectsQuery.data ?? []) {
      if (p.id) map[p.id] = { id: p.id, name: p.name, icon: p.icon ?? null };
    }
    return map;
  }, [projectsQuery.data]);

  const projectsError = projectsQuery.error ?? null;

  const error =
      (endpointsError as Error | undefined)?.message ??
      (projectsError as Error | undefined)?.message ??
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
    projects: projectsQuery.data ?? [],
    projectsById,

    isLoading: isLoadingEndpoints || projectsQuery.isLoading || deleteMutation.isPending,
    isLoadingProjects: projectsQuery.isLoading,
    isLoadingEndpoints,
    projectsError,
    endpointsError,
    error,

    createEndpoint,
    isCreating: createMutation.isPending,
    createError: createMutation.error ?? null,

    deleteEndpoints,
  };
}

