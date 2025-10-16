import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  readEndpointEndpointsEndpointIdGetOptions,
  readProjectsProjectsGetOptions,
  updateEndpointEndpointsEndpointIdPutMutation,
  invokeEndpointEndpointsEndpointIdInvokePostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import type {
  Endpoint,
  EndpointUpdate,
  JsonInput,
  Project,
} from '@/api-client/types.gen';

type EndpointView = {
  readonly id: string;
  readonly name: string | null;
  readonly description: string | null;
  readonly url: string | null;
  readonly protocol: string | null;
  readonly method: string | null;
  readonly environment: string | null;
  readonly projectId: string | null;
  readonly requestHeaders: Record<string, JsonInput> | null;
  readonly requestBodyTemplate: JsonInput | null;
  readonly responseMappings: JsonInput | null;
};

type ProjectOption = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly iconKey: string | null;
};

function toView(e: Endpoint): EndpointView {
  return {
    id: e.id,
    name: e.name ?? null,
    description: e.description ?? null,
    url: e.url ?? null,
    protocol: e.protocol ?? null,
    method: e.method ?? null,
    environment: e.environment ?? null,
    projectId: e.project_id ?? null,
    requestHeaders: (e.request_headers as Record<string, JsonInput> | undefined) ?? null,
    requestBodyTemplate: (e.request_body_template as JsonInput | undefined) ?? null,
    responseMappings: (e.response_mappings as JsonInput | undefined) ?? null,
  };
}

function toProjectOption(p: Project): ProjectOption {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    iconKey: p.icon ?? null,
  };
}

export function useEndpointData(identifier: string) {
  const queryClient = useQueryClient();

  const endpointQueryOptions = useMemo(
    () =>
      readEndpointEndpointsEndpointIdGetOptions({
        path: { endpoint_id: identifier },
      }),
    [identifier],
  );

  const projectsQueryOptions = useMemo(
    () =>
      readProjectsProjectsGetOptions({
        query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
      }),
    [],
  );

  const { data: endpointData, error, isLoading, isFetching } = useQuery({
    ...endpointQueryOptions,
    staleTime: 60_000,
    select: (e) => (e ? toView(e as Endpoint) : undefined),
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    ...projectsQueryOptions,
    staleTime: 300_000,
    select: (list) => (Array.isArray(list) ? list.map((p) => toProjectOption(p as Project)) : [] as ProjectOption[]),
  });

  const updateMutation = useMutation({
    ...updateEndpointEndpointsEndpointIdPutMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: endpointQueryOptions.queryKey });
    },
  });

  const invokeMutation = useMutation({
    ...invokeEndpointEndpointsEndpointIdInvokePostMutation(),
  });

  async function update(args: {
    readonly fields?: Partial<{
      name: string | null;
      description: string | null;
      url: string | null;
      protocol: string | null;
      method: string | null;
      environment: string | null;
      projectId: string | null;
    }>;
    readonly json?: Partial<{
      requestHeaders: string;
      requestBodyTemplate: string;
      responseMappings: string;
    }>;
  }) {
    const current = endpointData;
    if (!current) return;

    const body: EndpointUpdate = {
      name: args.fields?.name ?? current.name ?? undefined,
      description: args.fields?.description ?? current.description ?? undefined,
      url: args.fields?.url ?? current.url ?? undefined,
      protocol: (args.fields?.protocol ?? current.protocol ?? undefined) as EndpointUpdate['protocol'],
      method: (args.fields?.method ?? current.method ?? undefined) as EndpointUpdate['method'],
      environment: (args.fields?.environment ?? current.environment ?? undefined) as EndpointUpdate['environment'],
      project_id: args.fields?.projectId ?? current.projectId ?? undefined,
      request_headers: args.json?.requestHeaders
        ? (JSON.parse(args.json.requestHeaders) as EndpointUpdate['request_headers'])
        : (current.requestHeaders as EndpointUpdate['request_headers']) ?? undefined,
      request_body_template: args.json?.requestBodyTemplate
        ? (JSON.parse(args.json.requestBodyTemplate) as EndpointUpdate['request_body_template'])
        : (current.requestBodyTemplate as EndpointUpdate['request_body_template']) ?? undefined,
      response_mappings: args.json?.responseMappings
        ? (JSON.parse(args.json.responseMappings) as EndpointUpdate['response_mappings'])
        : (current.responseMappings as EndpointUpdate['response_mappings']) ?? undefined,
    };

    await updateMutation.mutateAsync({
      path: { endpoint_id: current.id },
      body,
    });
  }

  async function test(bodyJson: string): Promise<string> {
    const current = endpointData;
    if (!current) return JSON.stringify({ success: false, error: 'No endpoint loaded' }, null, 2);

    let parsed: unknown;
    try {
      parsed = JSON.parse(bodyJson);
    } catch (e) {
      return JSON.stringify({ success: false, error: 'Invalid JSON' }, null, 2);
    }

    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
      return JSON.stringify(
        { success: false, error: 'Test input must be a JSON object (key/value map).' },
        null,
        2,
      );
    }

    const res = await invokeMutation.mutateAsync({
      path: { endpoint_id: current.id },
      body: parsed as Record<string, JsonInput>,
    });

    return JSON.stringify(res, null, 2);
  }

  return {
    endpoint: endpointData,
    isLoading: isLoading || isFetching,
    error: error as Error | null,
    projects: (projectsData ?? []) as readonly ProjectOption[],
    projectsLoading,
    update,
    test,
    queryKey: endpointQueryOptions.queryKey,
  };
}

export async function prefetchEndpointData(
  qc: QueryClient,
  args: { identifier: string },
) {
  const endpointQuery = readEndpointEndpointsEndpointIdGetOptions({
    path: { endpoint_id: args.identifier },
  });
  const projectsQuery = readProjectsProjectsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'name', sort_order: 'asc' },
  });

  await qc.prefetchQuery({ ...endpointQuery, staleTime: 60_000 });
  await qc.prefetchQuery({ ...projectsQuery, staleTime: 300_000 });
}