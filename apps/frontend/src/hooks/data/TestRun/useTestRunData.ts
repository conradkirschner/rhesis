// apps/frontend/src/hooks/data/TestRun/useTestRunData.ts
'use client';

import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryFunction,
  type QueryKey,
} from '@tanstack/react-query';

import {
  readTestRunTestRunsTestRunIdGetOptions,
  readTestResultsTestResultsGetOptions,
  readPromptPromptsPromptIdGetOptions,
  getTestRunBehaviorsTestRunsTestRunIdBehaviorsGetOptions,
  readBehaviorMetricsBehaviorsBehaviorIdMetricsGetOptions,
  readTestRunsTestRunsGetOptions,
  downloadTestRunResultsTestRunsTestRunIdDownloadGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

import type {
  TestRunDetail,
  TestResultDetail,
  PaginatedTestResultDetail,
  Prompt,
  Behavior,
  RhesisBackendAppSchemasPaginationPaginatedMetricDetail1 as PaginatedMetricDetail,
} from '@/api-client/types.gen';

/** ========= Minimal UI shapes used by the container ========= */

type MetricShape = {
  is_successful?: boolean | null;
  reason?: string | null;
  score?: number | null;
  threshold?: number | null;
};

export type TestResultShape = {
  id: string;
  test_id?: string | null;
  /** Some backends include this on the row; expose it for history. */
  test_run_id?: string | null;
  prompt_id?: string | null;
  created_at?: string | null;
  test_output?: { output?: string | null } | null;
  test_metrics?: { metrics?: Record<string, MetricShape> | null } | null;
  counts?: { comments?: number | null; tasks?: number | null } | null;
  tags?: Array<{ name?: string | null }> | null;
};

type TestRunShape = {
  id: string;
  name?: string | null;
  created_at?: string | null;
  attributes?: {
    started_at?: string | null;
    completed_at?: string | null;
    environment?: string | null;
  } | null;
  test_configuration?: {
    test_set?: { id?: string | null; name?: string | null } | null;
    endpoint?: { id?: string | null; name?: string | null } | null;
  } | null;
};

type PromptShape = { content?: string | null; name?: string | null };

type BehaviorShape = {
  id: string;
  name: string;
  description?: string | null; // keep null here; UI can coerce to undefined if needed
  metrics?: Array<{ name: string; description?: string | null } | null> | null;
};

/** ========= Helpers to forward generator options safely =========
 * The generator types `queryFn` as `symbol | GenQueryFn<...>` (SkipToken or function).
 * We accept that union, then narrow to the real function with a type guard.
 */

type MaybeGenQueryFn<TData, TKey extends QueryKey> =
    | QueryFunction<TData, TKey>
    | symbol
    | undefined;

function hasRealQueryFn<TData, TKey extends QueryKey>(
    opts: { queryKey: TKey; queryFn?: MaybeGenQueryFn<TData, TKey> },
): opts is { queryKey: TKey; queryFn: QueryFunction<TData, TKey> } {
  return typeof opts.queryFn === 'function';
}

async function fetchFromOptions<TQueryFnData, TKey extends QueryKey>(
    qc: QueryClient,
    opts: { queryKey: TKey; queryFn?: MaybeGenQueryFn<TQueryFnData, TKey> },
): Promise<TQueryFnData> {
  if (!hasRealQueryFn<TQueryFnData, TKey>(opts)) {
    throw new Error('Generated options are missing a queryFn');
  }
  return qc.fetchQuery<TQueryFnData, Error, TQueryFnData, TKey>({
    queryKey: opts.queryKey,
    queryFn: opts.queryFn,
  });
}

/** When the generator’s data type is `unknown` (e.g., Blob downloads),
 *  parse the raw value to a strict output type. */
async function fetchAndParse<TRaw, TKey extends QueryKey, TOut>(
    qc: QueryClient,
    opts: { queryKey: TKey; queryFn?: MaybeGenQueryFn<TRaw, TKey> },
    parse: (raw: TRaw) => TOut,
): Promise<TOut> {
  const raw = await fetchFromOptions<TRaw, TKey>(qc, opts);
  return parse(raw);
}

function isBlob(val: unknown): val is Blob {
  return typeof Blob !== 'undefined' && val instanceof Blob;
}

/** ========= DTO -> UI mappers ========= */

function mapTestRun(dto: TestRunDetail): TestRunShape {
  return {
    id: dto.id,
    name: dto.name ?? null,
    created_at: dto.created_at ?? null,
    attributes: dto.attributes
        ? {
          started_at: dto.attributes.started_at ?? null,
          completed_at: dto.attributes.completed_at ?? null,
          environment: dto.attributes.environment ?? null,
        }
        : null,
    test_configuration: dto.test_configuration
        ? {
          test_set: dto.test_configuration.test_set
              ? {
                id: dto.test_configuration.test_set.id ?? null,
                name: dto.test_configuration.test_set.name ?? null,
              }
              : null,
          endpoint: dto.test_configuration.endpoint
              ? {
                id: dto.test_configuration.endpoint.id ?? null,
                name: dto.test_configuration.endpoint.name ?? null,
              }
              : null,
        }
        : null,
  };
}

function mapResult(dto: TestResultDetail): TestResultShape {
  return {
    id: dto.id,
    test_id: dto.test_id ?? null,
    test_run_id: (dto as any)?.test_run_id ?? null, // not always present
    prompt_id: dto.prompt_id ?? null,
    created_at: dto.created_at ?? null,
    test_output: dto.test_output ? { output: dto.test_output.output ?? null } : null,
    test_metrics: dto.test_metrics ? { metrics: dto.test_metrics.metrics ?? null } : null,
    counts: dto.counts
        ? { comments: dto.counts.comments ?? null, tasks: dto.counts.tasks ?? null }
        : null,
    tags: dto.tags ?? null,
  };
}

/** ========= Exported hook: fetch history of prior runs for a test ========= */
export function useTestRunHistory(testId: string | null) {
  // 1) Pull last N results for the given test id
  const rowsQuery = useQuery({
    ...readTestResultsTestResultsGetOptions({
      query: testId ? { $filter: `test_id eq '${testId}'`, limit: 50, skip: 0 } : {},
    }),
    enabled: Boolean(testId),
    staleTime: 60_000,
    select: (page: PaginatedTestResultDetail): TestResultShape[] =>
        (page.data ?? []).map(mapResult),
  });

  // 2) Gather related run ids from those results
  const runIds = useMemo(
      () =>
          Array.from(
              new Set(
                  (rowsQuery.data ?? [])
                      .map((r) => r.test_run_id ?? null)
                      .filter((v): v is string => !!v),
              ),
          ),
      [rowsQuery.data],
  );

  // 3) Resolve the run names
  const runQueries = useQueries({
    queries: runIds.map((id) => ({
      ...readTestRunTestRunsTestRunIdGetOptions({ path: { test_run_id: id } }),
      staleTime: 5 * 60_000,
      enabled: !!id,
      select: (dto: TestRunDetail): { id: string; name?: string | null } => ({
        id: dto.id,
        name: dto.name ?? null,
      }),
    })),
  });

  // 4) Present a compact history list
  const history = useMemo(() => {
    const nameMap = new Map<string, string>();
    runQueries.forEach((q, idx) => {
      const id = runIds[idx];
      const rec = q.data;
      if (id && rec) nameMap.set(id, (rec.name ?? id) as string);
    });

    const rows =
        (rowsQuery.data ?? []).map((r) => {
          const vals = Object.values(r.test_metrics?.metrics ?? {});
          const passedCount = vals.filter((m) => m?.is_successful).length;
          const total = vals.length;
          const passed = total > 0 && passedCount === total;
          const runId = r.test_run_id ?? 'unknown';

          return {
            id: r.id,
            testRunId: runId,
            testRunName: runId === 'unknown' ? 'unknown' : nameMap.get(runId) ?? runId,
            passed,
            passedMetrics: passedCount,
            totalMetrics: total,
            executedAt: r.created_at ?? new Date().toISOString(),
          };
        }) ?? [];

    rows.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
    const perRun = new Map<string, (typeof rows)[number]>();
    for (const row of rows) if (!perRun.has(row.testRunId)) perRun.set(row.testRunId, row);
    return Array.from(perRun.values()).slice(0, 10);
  }, [rowsQuery.data, runQueries, runIds]);

  return {
    history,
    isLoading: rowsQuery.isLoading || runQueries.some((q) => q.isLoading),
    isError: rowsQuery.isError || runQueries.some((q) => q.isError),
    error:
        (rowsQuery.error as Error | undefined) ??
        (runQueries.find((q) => q.error)?.error as Error | undefined),
  };
}

/** ========= Exported hook: full Test Run detail page data ========= */
export function useTestRunData(testRunId: string) {
  const qc = useQueryClient();

  /** Test run header */
  const testRunQuery = useQuery({
    ...readTestRunTestRunsTestRunIdGetOptions({ path: { test_run_id: testRunId } }),
    staleTime: 60_000,
    select: (dto: TestRunDetail): TestRunShape => mapTestRun(dto),
  });

  /** All results for this run (batched) */
  const testResultsQuery = useQuery({
    queryKey: ['testRuns', testRunId, 'results', 'all'],
    staleTime: 60_000,
    queryFn: async (): Promise<TestResultShape[]> => {
      const batchSize = 100;
      let skip = 0;
      const out: TestResultShape[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const opts = readTestResultsTestResultsGetOptions({
          query: {
            $filter: `test_run_id eq '${testRunId}'`,
            limit: batchSize,
            skip,
            sort_by: 'created_at',
            sort_order: 'desc',
          },
        });

        const page = await fetchFromOptions<PaginatedTestResultDetail, typeof opts.queryKey>(qc, opts);
        const data = page.data ?? [];
        for (const dto of data) out.push(mapResult(dto));

        const totalCount = page.pagination?.totalCount;
        if (typeof totalCount === 'number') {
          if (out.length >= totalCount) break;
        } else if (data.length < batchSize) {
          break;
        }

        skip += batchSize;
        if (skip > 10_000) break;
      }

      return out;
    },
  });

  /** Prompts map (dedup ids first) */
  const promptIds = useMemo(
      () =>
          Array.from(
              new Set(
                  (testResultsQuery.data ?? [])
                      .map((r) => r.prompt_id)
                      .filter((v): v is string => typeof v === 'string' && v.length > 0),
              ),
          ),
      [testResultsQuery.data],
  );

  const promptQueries = useQueries({
    queries: promptIds.map((id) => ({
      ...readPromptPromptsPromptIdGetOptions({ path: { prompt_id: id } }),
      enabled: true,
      staleTime: 5 * 60_000,
      select: (p: Prompt): PromptShape => ({
        content: p.content ?? null,
        name: undefined, // Prompt schema may not include a name
      }),
    })),
  });

  const promptsMap = useMemo<Record<string, { content: string; name?: string }>>(() => {
    const m: Record<string, { content: string; name?: string }> = {};
    promptQueries.forEach((q, idx) => {
      const id = promptIds[idx];
      const d = q.data;
      if (id && d) {
        m[id] = { content: d.content ?? '', name: d.name ?? undefined };
      }
    });
    return m;
  }, [promptQueries, promptIds]);

  /** Behaviors + metrics */
  const behaviorsQuery = useQuery({
    ...getTestRunBehaviorsTestRunsTestRunIdBehaviorsGetOptions({
      path: { test_run_id: testRunId },
    }),
    staleTime: 5 * 60_000,
    select: (arr: Behavior[]): BehaviorShape[] =>
        (arr ?? [])
            .filter((b): b is Behavior & { id: string; name: string } => typeof b?.id === 'string' && typeof b?.name === 'string')
            .map((b) => ({
              id: b.id,
              name: b.name,
              description: b.description ?? null,
              metrics: null, // filled below
            })),
  });

  const metricsQueries = useQueries({
    queries: (behaviorsQuery.data ?? []).map((b) => ({
      ...readBehaviorMetricsBehaviorsBehaviorIdMetricsGetOptions({ path: { behavior_id: b.id } }),
      staleTime: 5 * 60_000,
      enabled: true,
      select: (
          metricsResp:
              | PaginatedMetricDetail
              | Array<{ name?: string | null; description?: string | null }>
      ): Array<{ name: string; description?: string }> => {
        const list = Array.isArray(metricsResp)
            ? metricsResp
            : Array.isArray(metricsResp.data)
                ? metricsResp.data
                : [];
        return list
            .filter((m): m is { name: string; description?: string | null } => typeof m?.name === 'string')
            .map((m) => ({ name: m.name, description: m.description ?? undefined }));
      },
    })),
  });

  const behaviors = useMemo<
      Array<{ id: string; name: string; description?: string | null; metrics: Array<{ name: string; description?: string }> }>
  >(() => {
    const raw = behaviorsQuery.data ?? [];
    return raw.map((b, idx) => {
      const metrics = metricsQueries[idx]?.data ?? [];
      return { id: b.id, name: b.name, description: b.description ?? null, metrics };
    });
  }, [behaviorsQuery.data, metricsQueries]);

  /** Available runs (recent) */
  const availableRunsQuery = useQuery({
    ...readTestRunsTestRunsGetOptions({
      query: { limit: 50, skip: 0, sort_by: 'created_at', sort_order: 'desc' },
    }),
    staleTime: 60_000,
    select: (page): Array<{ id: string; name?: string; created_at: string; pass_rate?: number }> => {
      const data = Array.isArray((page as { data?: TestRunDetail[] }).data)
          ? (page as { data?: TestRunDetail[] }).data!
          : [];
      return data
          .filter((r) => typeof r.id === 'string' && r.id !== testRunId)
          .map((r) => ({
            id: r.id,
            name: r.name ?? undefined,
            created_at: r.attributes?.started_at ?? r.created_at ?? '',
            pass_rate: undefined,
          }));
    },
  });

  /** Download results (CSV blob) */
  const downloadMutation = useMutation({
    mutationKey: ['testRuns', testRunId, 'download'],
    mutationFn: async (): Promise<Blob> => {
      const opts = downloadTestRunResultsTestRunsTestRunIdDownloadGetOptions({
        path: { test_run_id: testRunId },
      });
      return fetchAndParse<unknown, typeof opts.queryKey, Blob>(qc, opts, (raw) => {
        if (isBlob(raw)) return raw;
        throw new Error('Expected a Blob from download endpoint');
      });
    },
  });

  /** Imperative: load another run’s results (batched) */
  const loadBaselineResults = useCallback(
      async (baselineTestRunId: string): Promise<TestResultShape[]> => {
        const batchSize = 100;
        let skip = 0;
        const out: TestResultShape[] = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const opts = readTestResultsTestResultsGetOptions({
            query: {
              $filter: `test_run_id eq '${baselineTestRunId}'`,
              limit: batchSize,
              skip,
              sort_by: 'created_at',
              sort_order: 'desc',
            },
          });

          const page = await fetchFromOptions<PaginatedTestResultDetail, typeof opts.queryKey>(qc, opts);
          const data = page.data ?? [];
          for (const dto of data) out.push(mapResult(dto));

          const totalCount = page.pagination?.totalCount;
          if (typeof totalCount === 'number') {
            if (out.length >= totalCount) break;
          } else if (data.length < batchSize) {
            break;
          }

          skip += batchSize;
          if (skip > 10_000) break;
        }
        return out;
      },
      [qc],
  );

  return {
    /** data */
    testRun: testRunQuery.data,
    testResults: testResultsQuery.data ?? [],
    prompts: promptsMap as Record<string, { content: string; name?: string }>,
    behaviors,
    availableTestRuns: availableRunsQuery.data ?? [],

    /** status */
    isLoading:
        testRunQuery.isLoading ||
        testResultsQuery.isLoading ||
        behaviorsQuery.isLoading ||
        metricsQueries.some((q) => q.isLoading),
    isError: testRunQuery.isError || testResultsQuery.isError || behaviorsQuery.isError,
    error:
        (testRunQuery.error as Error | undefined) ??
        (testResultsQuery.error as Error | undefined) ??
        (behaviorsQuery.error as Error | undefined),

    /** actions */
    downloadResults: downloadMutation.mutateAsync,
    loadBaselineResults,
  };
}

/** ========= Server utility (optional) ========= */
export async function fetchAllResultsServer(qc: QueryClient, testRunId: string) {
  const batchSize = 100;
  let skip = 0;
  const out: TestResultShape[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const opts = readTestResultsTestResultsGetOptions({
      query: {
        $filter: `test_run_id eq '${testRunId}'`,
        limit: batchSize,
        skip,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    });

    const page = await fetchFromOptions<PaginatedTestResultDetail, typeof opts.queryKey>(qc, opts);
    const data = page.data ?? [];
    for (const dto of data) out.push(mapResult(dto));

    const totalCount = page.pagination?.totalCount;
    if (typeof totalCount === 'number') {
      if (out.length >= totalCount) break;
    } else if (data.length < batchSize) {
      break;
    }

    skip += batchSize;
    if (skip > 10_000) break;
  }

  return out;
}
