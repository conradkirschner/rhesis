import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  readTestSetsTestSetsGetOptions,
  deleteTestSetTestSetsTestSetIdDeleteMutation,
  readProjectsProjectsGetOptions,
  readEndpointsEndpointsGetOptions,
  executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation,
  readStatusesStatusesGetOptions,
  readUsersUsersGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

type Pagination = {
  readonly page: number;
  readonly pageSize: number;
};

type ExecutionMode = 'Parallel' | 'Sequential';

function mapRows(raw: unknown): {
  readonly rows: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly behaviors: readonly string[];
    readonly categories: readonly string[];
    readonly totalTests: number;
    readonly statusLabel: string;
    readonly assignee?: {
      readonly name?: string;
      readonly given_name?: string;
      readonly family_name?: string;
      readonly email?: string;
      readonly picture?: string;
    } | null;
    readonly counts?: { readonly comments?: number; readonly tasks?: number };
  }>;
  readonly totalCount: number;
} {
  const isPaginated = (x: unknown): x is { data?: unknown[]; pagination?: { totalCount?: number } } =>
    typeof x === 'object' && x !== null && ('data' in (x as Record<string, unknown>) || 'pagination' in (x as Record<string, unknown>));

  if (Array.isArray(raw)) {
    const rows = raw.map((t) => {
      const ts = t as Record<string, unknown>;
      const attributes = (ts.attributes as Record<string, unknown>) ?? {};
      const meta = (attributes['metadata'] as Record<string, unknown>) ?? {};
      const status = ts['status'];
      const statusLabel =
        typeof status === 'string'
          ? status
          : status && typeof status === 'object' && 'name' in (status as Record<string, unknown>)
            ? String((status as Record<string, unknown>).name)
            : 'Unknown';
      const assignee = (ts['assignee'] as Record<string, unknown> | null | undefined) ?? null;
      const counts = (ts['counts'] as Record<string, unknown> | undefined) ?? undefined;

      return {
        id: String(ts['id'] ?? ''),
        name: String(ts['name'] ?? ''),
        behaviors: (meta['behaviors'] as string[] | undefined)?.slice() ?? [],
        categories: (meta['categories'] as string[] | undefined)?.slice() ?? [],
        totalTests: Number(meta['total_tests'] ?? 0),
        statusLabel,
        assignee: assignee
          ? {
              name: typeof assignee.name === 'string' ? assignee.name : undefined,
              given_name: typeof assignee.given_name === 'string' ? assignee.given_name : undefined,
              family_name: typeof assignee.family_name === 'string' ? assignee.family_name : undefined,
              email: typeof assignee.email === 'string' ? assignee.email : undefined,
              picture: typeof assignee.picture === 'string' ? assignee.picture : undefined,
            }
          : null,
        counts: counts
          ? {
              comments: Number((counts['comments'] as number | undefined) ?? 0),
              tasks: Number((counts['tasks'] as number | undefined) ?? 0),
            }
          : undefined,
      } as const;
    });
    return { rows, totalCount: rows.length };
  }

  if (isPaginated(raw)) {
    const data = Array.isArray(raw.data) ? raw.data : [];
    const { rows } = mapRows(data);
    const totalCount = typeof raw.pagination?.totalCount === 'number' ? raw.pagination.totalCount : rows.length;
    return { rows, totalCount };
  }

  return { rows: [], totalCount: 0 };
}

export function useTestSetsList(pagination: Pagination) {
  const skip = pagination.page * pagination.pageSize;
  const limit = pagination.pageSize;

  const query = useQuery({
    ...readTestSetsTestSetsGetOptions({
      query: {
        skip,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    }),
    placeholderData: keepPreviousData,
  });

  const raw = query.data as unknown;
  const { rows, totalCount } = mapRows(raw);

  return {
    rows,
    totalCount,
    isLoading: query.isFetching && !query.data,
    refetch: query.refetch,
  } as const;
}

export function useDeleteTestSets() {
  const qc = useQueryClient();
  const listKey = readTestSetsTestSetsGetOptions({
    query: { skip: 0, limit: 25, sort_by: 'created_at', sort_order: 'desc' },
  }).queryKey;

  const mutation = useMutation({
    ...deleteTestSetTestSetsTestSetIdDeleteMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: listKey });
    },
  });

  return {
    isDeleting: mutation.isPending,
    deleteMany: async (ids: readonly string[]) => {
      await Promise.all(ids.map((id) => mutation.mutateAsync({ path: { test_set_id: String(id) } })));
    },
  } as const;
}

export function useProjectsLookup() {
  const query = useQuery({
    ...readProjectsProjectsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', limit: 100 } }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const projects =
    (query.data as { data?: unknown[] } | undefined)?.data?.map((p) => {
      const pr = p as Record<string, unknown>;
      return { id: String(pr['id'] ?? ''), name: String(pr['name'] ?? '') } as const;
    }) ?? [];

  return { projects, isLoading: query.isFetching && !query.data } as const;
}

export function useEndpointsLookup(projectId: string | null) {
  const query = useQuery({
    ...readEndpointsEndpointsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', limit: 100 } }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const endpointsAll =
    (query.data as { data?: unknown[] } | undefined)?.data?.map((e) => {
      const ep = e as Record<string, unknown>;
      return {
        id: String(ep['id'] ?? ''),
        name: String(ep['name'] ?? ''),
        project_id: ep['project_id'] ? String(ep['project_id']) : null,
        environment: (ep['environment'] as 'production' | 'staging' | 'development' | undefined) ?? undefined,
      } as const;
    }) ?? [];

  const endpoints = projectId ? endpointsAll.filter((e) => e.project_id === projectId) : [];

  return { endpoints, isLoading: query.isFetching && !query.data } as const;
}

export function useExecuteTestSets() {
  const mutation = useMutation({
    ...executeTestSetTestSetsTestSetIdentifierExecuteEndpointIdPostMutation(),
  });

  return {
    isExecuting: mutation.isPending,
    execute: async (ids: readonly string[], endpointId: string, mode: ExecutionMode) => {
      await Promise.all(
        ids.map((id) =>
          mutation.mutateAsync({
            path: { test_set_identifier: String(id), endpoint_id: endpointId },
            body: { execution_mode: mode },
          }),
        ),
      );
    },
  } as const;
}

export function useStatusesLookup() {
  const query = useQuery({
    ...readStatusesStatusesGetOptions({ query: { entity_type: 'TestSet', sort_by: 'name', sort_order: 'asc' } }),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });

  const statuses =
    (query.data as { data?: unknown[] } | undefined)?.data?.map((s) => {
      const st = s as Record<string, unknown>;
      return { id: String(st['id'] ?? ''), name: String(st['name'] ?? '') } as const;
    }) ?? [];

  return { statuses, isLoading: query.isFetching && !query.data } as const;
}

export function useUsersLookup() {
  const query = useQuery({
    ...readUsersUsersGetOptions(),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });

  const users =
    (query.data as { data?: unknown[] } | undefined)?.data?.map((u) => {
      const us = u as Record<string, unknown>;
      return {
        id: String(us['id'] ?? ''),
        name: typeof us['name'] === 'string' ? (us['name'] as string) : undefined,
        given_name: typeof us['given_name'] === 'string' ? (us['given_name'] as string) : undefined,
        family_name: typeof us['family_name'] === 'string' ? (us['family_name'] as string) : undefined,
        email: typeof us['email'] === 'string' ? (us['email'] as string) : undefined,
        picture: typeof us['picture'] === 'string' ? (us['picture'] as string) : undefined,
      } as const;
    }) ?? [];

  return { users, isLoading: query.isFetching && !query.data } as const;
}