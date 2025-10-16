import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  readProjectsProjectsGetOptions,
  createEndpointEndpointsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

// SDK types are used only within this hook (not exported)
import type {
  EndpointCreate,
  PaginatedProjectDetail,
  ProjectDetail,
} from '@/api-client/types.gen';

const PROJECTS_QUERY = readProjectsProjectsGetOptions({
  query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
});

type Environment = 'production' | 'staging' | 'development';

type CreateFromOpenApiArgs = {
  readonly name: string;
  readonly description?: string;
  readonly environment: Environment;
  readonly openapi_spec_url: string;
  readonly project_id: string;
};

export function useSwaggerEndpointData() {
  const {
    data: projectsPage,
    isLoading: loadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    ...PROJECTS_QUERY,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation(createEndpointEndpointsPostMutation());

  const projects = useMemo(() => {
    const page = projectsPage as PaginatedProjectDetail | undefined;
    const items: readonly ProjectDetail[] = page?.data ?? [];
    return items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      icon: (p as { icon?: string | null }).icon ?? null,
    })) as readonly {
      id: string;
      name: string;
      description: string;
      icon: string | null;
    }[];
  }, [projectsPage]);

  const projectsErrorMessage =
    isProjectsError && projectsError
      ? (projectsError as Error).message
      : null;

  async function createFromOpenApi(args: CreateFromOpenApiArgs): Promise<{ id: string }> {
    const body: EndpointCreate = {
      name: args.name,
      description: args.description ?? null,
      project_id: args.project_id,
      environment: args.environment,
      config_source: 'openapi',
      openapi_spec_url: args.openapi_spec_url,
      // Minimum required to satisfy server schema; values updated by OpenAPI import later.
      url: '',
      protocol: 'REST',
      method: 'POST',
      response_format: 'json',
      endpoint_path: '',
    };

    const created = await mutation.mutateAsync({ body });
    return { id: (created as { id: string }).id };
  }

  return {
    projects,
    loadingProjects,
    projectsErrorMessage,
    createFromOpenApi,
  };
}