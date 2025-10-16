import { useMemo } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
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

/** @see UI types are defined in feature ui/types.ts. Keep shapes minimal & serializable here. */

type MetricShape = {
  is_successful?: boolean | null;
  reason?: string | null;
  score?: number | null;
  threshold?: number | null;
};

type TestResultShape = {
  id: string;
  test_id?: string | null;
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
  description?: string | null;
  metrics?: Array<{ name: string; description?: string | null } | null> | null;
};

export function useTestRunData(testRunId: string) {
  const qc = useQueryClient();

  /** Primary entity */
  const testRunQuery = useQuery({
    ...readTestRunTestRunsTestRunIdGetOptions({ path: { test_run_id: testRunId } }),
    staleTime: 60_000,
    select: (data): TestRunShape => (data ?? {}) as TestRunShape,
  });

  /** All results for this run (batched) */
  const testResultsQuery = useQuery({
    queryKey: ['testRuns', testRunId, 'results', 'all'],
    staleTime: 60_000,
    queryFn: async (): Promise<TestResultShape[]> => {
      const batchSize = 100;
      let skip = 0;
      let out: TestResultShape[] = [];

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

        const page = (await qc.fetchQuery(opts)) as unknown as {
          data?: TestResultShape[];
          pagination?: { totalCount?: number };
        };

        const pageData = page?.data ?? [];
        out = out.concat(pageData);

        const totalCount = page?.pagination?.totalCount;
        if (typeof totalCount === 'number') {
          if (out.length >= totalCount) break;
        } else if (pageData.length < batchSize) {
          break;
        }

        skip += batchSize;
        if (skip > 10_000) break;
      }

      return out;
    },
  });

  /** Prompts (dedup per prompt_id) */
  const promptIds = useMemo(
    () =>
      Array.from(
        new Set(
          (testResultsQuery.data ?? [])
            .map((r) => r.prompt_id)
            .filter((v): v is string => Boolean(v)),
        ),
      ),
    [testResultsQuery.data],
  );

  const promptQueries = useQueries({
    queries: promptIds.map((id) => ({
      ...readPromptPromptsPromptIdGetOptions({ path: { prompt_id: id } }),
      enabled: !!id,
      staleTime: 5 * 60_000,
      select: (p): PromptShape | undefined => (p ?? undefined) as unknown as PromptShape,
    })),
  });

  const promptsMap = useMemo<Record<string, { content: string; name?: string }>>(() => {
    const m: Record<string, { content: string; name?: string }> = {};
    promptQueries.forEach((q, idx) => {
      if (q.data) {
        const id = promptIds[idx];
        m[id] = {
          content: q.data.content ?? '',
          name: q.data.name ?? undefined,
        };
      }
    });
    return m;
  }, [promptQueries, promptIds]);

  /** Behaviors with metrics list */
  const behaviorsQuery = useQuery({
    ...getTestRunBehaviorsTestRunsTestRunIdBehaviorsGetOptions({
      path: { test_run_id: testRunId },
    }),
    staleTime: 5 * 60_000,
    select: (arr): BehaviorShape[] => (arr ?? []) as unknown as BehaviorShape[],
  });

  const metricsQueries = useQueries({
    queries: (behaviorsQuery.data ?? [])
      .filter((b): b is BehaviorShape & { id: string } => Boolean(b && b.id))
      .map((b) => ({
        ...readBehaviorMetricsBehaviorsBehaviorIdMetricsGetOptions({
          path: { behavior_id: b.id },
        }),
        staleTime: 5 * 60_000,
        enabled: Boolean(b.id),
        select: (metricsResp): Array<{ name: string; description?: string }> => {
          const raw = metricsResp as unknown as
            | Array<{ name?: string | null; description?: string | null }>
            | { data?: Array<{ name?: string | null; description?: string | null }> }
            | undefined;

          const list: Array<{ name?: string | null; description?: string | null }> = Array.isArray(raw)
            ? raw
            : Array.isArray((raw as any)?.data)
              ? ((raw as any).data as Array<{ name?: string | null; description?: string | null }>)
              : [];

          return list
            .filter((m) => !!m?.name)
            .map((m) => ({ name: String(m.name), description: m.description ?? undefined }));
        },
      })),
  });

  const behaviors = useMemo<
    Array<{ id: string; name: string; description?: string; metrics: Array<{ name: string; description?: string }> }>
  >(() => {
    const raw = behaviorsQuery.data ?? [];
    return raw.map((b, idx) => {
      const metrics = metricsQueries[idx]?.data ?? [];
      return {
        id: String(b.id),
        name: b.name,
        description: b.description ?? undefined,
        metrics,
      };
    });
  }, [behaviorsQuery.data, metricsQueries]);

  /** Available runs (for comparison selector) */
  const availableRunsQuery = useQuery({
    ...readTestRunsTestRunsGetOptions({
      query: {
        limit: 50,
        skip: 0,
        sort_by: 'created_at',
        sort_order: 'desc',
        test_configuration_id: (testRunQuery.data as any)?.test_configuration?.id,
      },
    }),
    staleTime: 60_000,
    select: (rows): Array<{ id: string; name?: string; created_at: string; pass_rate?: number }> => {
      const list = (rows as unknown as { data?: any[] } | any[]) ?? [];
      const data = Array.isArray(list) ? list : Array.isArray(list.data) ? list.data : [];
      return data
        .filter((r) => r?.id && r.id !== testRunId)
        .map((r) => ({
          id: String(r.id),
          name: (r as { name?: string | null }).name ?? undefined,
          created_at:
            (r as { attributes?: { started_at?: string | null } }).attributes?.started_at ??
            (r as { created_at?: string | null }).created_at ??
            '',
          pass_rate: undefined,
        }));
    },
  });

  /** Download results as CSV blob */
  const downloadMutation = useMutation({
    mutationKey: ['testRuns', testRunId, 'download'],
    mutationFn: async (): Promise<Blob> => {
      const opts = downloadTestRunResultsTestRunsTestRunIdDownloadGetOptions({
        path: { test_run_id: testRunId },
      });
      const blob = (await qc.fetchQuery(opts)) as unknown as Blob;
      return blob;
    },
  });

  /** Imperative: load baseline run's results (batched) */
  const loadBaselineResults = async (baselineTestRunId: string): Promise<TestResultShape[]> => {
    const batchSize = 100;
    let skip = 0;
    let out: TestResultShape[] = [];

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

      const page = (await qc.fetchQuery(opts)) as unknown as {
        data?: TestResultShape[];
        pagination?: { totalCount?: number };
      };

      const pageData = page?.data ?? [];
      out = out.concat(pageData);

      const totalCount = page?.pagination?.totalCount;
      if (typeof totalCount === 'number') {
        if (out.length >= totalCount) break;
      } else if (pageData.length < batchSize) {
        break;
      }

      skip += batchSize;
      if (skip > 10_000) break;
    }
    return out;
  };

  return {
    /** data */
    testRun: testRunQuery.data,
    testResults: testResultsQuery.data ?? [],
    prompts: promptsMap,
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

/** History helper hook kept here to centralize SDK I/O. */
export function useTestRunHistory(testId: string | null) {
  const rowsQuery = useQuery({
    ...readTestResultsTestResultsGetOptions({
      query: testId ? { $filter: `test_id eq '${testId}'`, limit: 50, skip: 0 } : {},
    }),
    enabled: Boolean(testId),
    staleTime: 60_000,
    select: (page): TestResultShape[] => {
      const p = (page as unknown as { data?: TestResultShape[] }) ?? {};
      return p.data ?? [];
    },
  });

  const runIds = useMemo(
    () =>
      Array.from(
        new Set(
          (rowsQuery.data ?? [])
            .map((r) => r.test_run_id as unknown as string | null)
            .filter((v): v is string => !!v),
        ),
      ),
    [rowsQuery.data],
  );

  const runQueries = useQueries({
    queries: runIds.map((id) => ({
      queryKey: readTestRunTestRunsTestRunIdGetOptions({ path: { test_run_id: id } }).queryKey,
      queryFn: async () => (await readTestRunTestRunsTestRunIdGet({ path: { test_run_id: id } })) as TestRunShape,
      staleTime: 5 * 60_000,
      enabled: !!id,
      select: (r): { id: string; name?: string | null } => ({ id: r.id, name: (r as any).name ?? null }),
    })),
  });

  const history = useMemo(() => {
    const nameMap = new Map<string, string>();
    runQueries.forEach((q, idx) => {
      const id = runIds[idx];
      const rec = q.data;
      if (id && rec) nameMap.set(id, (rec.name ?? id) as string);
    });

    const rows =
      (rowsQuery.data ?? []).map((r) => {
        const metrics = r.test_metrics?.metrics ?? {};
        const vals = Object.values(metrics ?? {});
        const passedCount = vals.filter((m) => m?.is_successful).length;
        const total = vals.length;
        const passed = total > 0 && passedCount === total;
        const runId = (r as any).test_run_id ?? 'unknown';

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

    // newest first, unique per run
    rows.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
    const perRun = new Map<string, (typeof rows)[number]>();
    for (const row of rows) if (!perRun.has(row.testRunId)) perRun.set(row.testRunId, row);
    return Array.from(perRun.values()).slice(0, 10);
  }, [rowsQuery.data, runQueries, runIds]);

  return {
    history,
    isLoading: rowsQuery.isLoading || runQueries.some((q) => q.isLoading),
    isError: rowsQuery.isError || runQueries.some((q) => q.isError),
    error: (rowsQuery.error as Error | undefined) ?? (runQueries.find((q) => q.error)?.error as Error | undefined),
  };
}

/** Server-safe helper for prefetcher to reuse the batch logic */
export async function fetchAllResultsServer(qc: QueryClient, testRunId: string) {
  const batchSize = 100;
  let skip = 0;
  let out: TestResultShape[] = [];

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

    const page = (await qc.fetchQuery(opts)) as unknown as {
      data?: TestResultShape[];
      pagination?: { totalCount?: number };
    };

    const pageData = page?.data ?? [];
    out = out.concat(pageData);

    const totalCount = page?.pagination?.totalCount;
    if (typeof totalCount === 'number') {
      if (out.length >= totalCount) break;
    } else if (pageData.length < batchSize) {
      break;
    }

    skip += batchSize;
    if (skip > 10_000) break;
  }

  return out;
}