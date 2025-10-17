// src/hooks/data/Metrics/useMetricsData.ts
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  // listings
  readBehaviorsBehaviorsGetOptions,
  readMetricsMetricsGetOptions,
  readModelsModelsGetOptions,
  // behavior↔metric linking
  addBehaviorToMetricMetricsMetricIdBehaviorsBehaviorIdPostMutation,
  removeBehaviorFromMetricMetricsMetricIdBehaviorsBehaviorIdDeleteMutation,
  // behavior CRUD
  createBehaviorBehaviorsPostMutation,
  updateBehaviorBehaviorsBehaviorIdPutMutation,
  deleteBehaviorBehaviorsBehaviorIdDeleteMutation,
  // metric delete
  deleteMetricMetricsMetricIdDeleteMutation,
  // metric create (keep feature)
  createMetricMetricsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import type { ScoreType } from '@/api-client/types.gen';
import { formatEvaluationSteps } from '../../../lib/metrics/formatEvaluationSteps';

/** ===== Types returned to containers/UI ===== */
export type BehaviorItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly metricIds: readonly string[];
};

export type MetricItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly backend: string | null;
  readonly metricType: string | null;
  readonly scoreType: ScoreType | null;
  readonly behaviorIds: readonly string[];
};

export type FilterOptions = {
  readonly backend: readonly string[]; // lower-case; UI compares with .toLowerCase()
  readonly type: readonly { value: string; description: string }[];
  readonly scoreType: readonly { value: 'binary' | 'numeric'; label: string }[];
};

export type CreateMetricInput = {
  readonly name: string;
  readonly description?: string;
  readonly evaluation_prompt: string;
  readonly evaluation_steps: readonly string[];
  readonly reasoning?: string;
  readonly score_type: ScoreType;
  readonly min_score?: number;
  readonly max_score?: number;
  readonly threshold?: number;
  readonly explanation: string;
  readonly model_id: string;
  readonly owner_id?: string;
};

export function useMetricsData(options?: { readonly enabled?: boolean }) {
  const qc = useQueryClient();
  const enabled = options?.enabled ?? true;

  // ---------- Queries: Behaviors & Metrics ----------
  const behaviorsOpts = readBehaviorsBehaviorsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
  });
  const metricsOpts = readMetricsMetricsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
  });

  const behaviorsQuery = useQuery({
    ...behaviorsOpts,
    enabled,
    staleTime: 60_000,
    select: (res): readonly BehaviorItem[] =>
        (res.data ?? [])
            .filter((b): b is NonNullable<typeof b> & { id: string } => Boolean(b?.id))
            .map((b) => {
              const metricIds =
                  (Array.isArray(b.metrics) ? b.metrics : [])
                      .map((m) => m?.id)
                      .filter((id): id is string => Boolean(id)) ?? [];
              return {
                id: b.id as string,
                name: b.name ?? '',
                description: b.description ?? null,
                metricIds: metricIds as readonly string[],
              };
            }),
  });

  const metricsQuery = useQuery({
    ...metricsOpts,
    enabled,
    staleTime: 60_000,
    select: (res): readonly MetricItem[] =>
        (res.data ?? [])
            .filter((m): m is NonNullable<typeof m> & { id: string } => Boolean(m?.id))
            .map((m) => {
              const behaviorIds =
                  (Array.isArray(m.behaviors) ? m.behaviors : [])
                      .map((b) => b?.id)
                      .filter((id): id is string => Boolean(id)) ?? [];
              return {
                id: m.id as string,
                name: m.name ?? '',
                description: m.description ?? null,
                backend: m.backend_type?.type_value ?? null,
                metricType: m.metric_type?.type_value ?? null,
                scoreType: (m.score_type ?? null) as ScoreType | null,
                behaviorIds: behaviorIds as readonly string[],
              };
            }),
  });

  // ---------- Models (single query; ensure description is `string | undefined`) ----------
  const modelsQueryOpts = readModelsModelsGetOptions({
    query: { sort_by: 'name', sort_order: 'asc', skip: 0, limit: 100 },
  });

  const modelsQuery = useQuery({
    ...modelsQueryOpts,
    enabled,
    staleTime: 5 * 60 * 1000,
    select: (res) =>
        (res.data ?? []).map((m) => ({
          id: m.id!,
          name: m.name ?? 'No Name',
          // ✅ make it `string | undefined` (not null) to satisfy UiModelOption
          description: m.description ?? undefined,
        })),
  });

  // ---------- Derived Filter Options (matches MetricsContainer expectations) ----------
  const filterOptions: FilterOptions = useMemo(() => {
    const backends = new Set<string>();
    const types = new Map<string, string>();

    (metricsQuery.data ?? []).forEach((m) => {
      if (m.backend) backends.add(m.backend.toLowerCase());
      if (m.metricType) types.set(m.metricType, '');
    });

    return {
      backend: [...backends].sort(),
      type: [...types.keys()].sort().map((value) => ({ value, description: '' })),
      // keep UI shape: array of {value,label}
      scoreType: [
        { value: 'binary', label: 'Binary (Pass/Fail)' },
        { value: 'numeric', label: 'Numeric' },
      ],
    } as const;
  }, [metricsQuery.data]);

  // ---------- Mutations (NO onSuccess in options — v5-safe; invalidate after mutate) ----------
  const assignMetricToBehaviorMutation = useMutation(
      addBehaviorToMetricMetricsMetricIdBehaviorsBehaviorIdPostMutation(),
  );
  const removeMetricFromBehaviorMutation = useMutation(
      removeBehaviorFromMetricMetricsMetricIdBehaviorsBehaviorIdDeleteMutation(),
  );
  const createBehaviorMutation = useMutation(createBehaviorBehaviorsPostMutation());
  const updateBehaviorMutation = useMutation(updateBehaviorBehaviorsBehaviorIdPutMutation());
  const deleteBehaviorMutation = useMutation(deleteBehaviorBehaviorsBehaviorIdDeleteMutation());
  const deleteMetricMutation = useMutation(deleteMetricMetricsMetricIdDeleteMutation());
  const createMetricMutation = useMutation(createMetricMetricsPostMutation());

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: behaviorsOpts.queryKey }),
      qc.invalidateQueries({ queryKey: metricsOpts.queryKey }),
    ]);
  };

  const create = async (input: CreateMetricInput) => {
    const formattedSteps = formatEvaluationSteps(input.evaluation_steps);
    await createMetricMutation.mutateAsync({
      body: {
        name: input.name,
        description: input.description ?? '',
        evaluation_prompt: input.evaluation_prompt,
        evaluation_steps: formattedSteps,
        reasoning: input.reasoning ?? '',
        score_type: input.score_type,
        min_score: input.score_type === 'numeric' ? input.min_score : undefined,
        max_score: input.score_type === 'numeric' ? input.max_score : undefined,
        threshold: input.score_type === 'numeric' ? input.threshold : undefined,
        explanation: input.explanation,
        model_id: input.model_id || undefined,
        owner_id: input.owner_id || undefined,
      },
    });
    await qc.invalidateQueries({ queryKey: metricsOpts.queryKey });
  };

  // ---------- Public mutations (wrap + invalidate) ----------
  const mutations = {
    assignMetricToBehavior: async (behaviorId: string, metricId: string) => {
      await assignMetricToBehaviorMutation.mutateAsync({
        path: { behavior_id: behaviorId, metric_id: metricId },
      });
      await invalidateAll();
    },
    removeMetricFromBehavior: async (behaviorId: string, metricId: string) => {
      await removeMetricFromBehaviorMutation.mutateAsync({
        path: { behavior_id: behaviorId, metric_id: metricId },
      });
      await invalidateAll();
    },
    createBehavior: async (name: string, description: string | null, organization_id: string) => {
      await createBehaviorMutation.mutateAsync({ body: { name, description, organization_id } });
      await qc.invalidateQueries({ queryKey: behaviorsOpts.queryKey });
    },
    updateBehavior: async (
        behaviorId: string,
        name: string,
        description: string | null,
        organization_id: string,
    ) => {
      await updateBehaviorMutation.mutateAsync({
        path: { behavior_id: behaviorId },
        body: { name, description, organization_id },
      });
      await qc.invalidateQueries({ queryKey: behaviorsOpts.queryKey });
    },
    deleteBehavior: async (behaviorId: string) => {
      await deleteBehaviorMutation.mutateAsync({ path: { behavior_id: behaviorId } });
      await invalidateAll();
    },
    deleteMetric: async (metricId: string) => {
      await deleteMetricMutation.mutateAsync({ path: { metric_id: metricId } });
      await qc.invalidateQueries({ queryKey: metricsOpts.queryKey });
    },
  } as const;

  // ---------- Aggregate state ----------
  const isLoading = behaviorsQuery.isPending || metricsQuery.isPending;
  const error =
      (behaviorsQuery.isError && (behaviorsQuery.error as Error)?.message) ||
      (metricsQuery.isError && (metricsQuery.error as Error)?.message) ||
      null;

  return {
    // === For MetricsContainer ===
    behaviors: (behaviorsQuery.data ?? []) as readonly BehaviorItem[],
    metrics: (metricsQuery.data ?? []) as readonly MetricItem[],
    filterOptions,
    isLoading,
    error,
    mutations,

    // === Extra features preserved ===
    models: modelsQuery.data ?? [],
    isLoadingModels: modelsQuery.isPending,
    isCreating: createMetricMutation.isPending,
    create,

    // Optional: expose keys for precise invalidation elsewhere
    queryKeys: {
      behaviors: behaviorsOpts.queryKey,
      metrics: metricsOpts.queryKey,
      models: modelsQueryOpts.queryKey,
    },
  } as const;
}
