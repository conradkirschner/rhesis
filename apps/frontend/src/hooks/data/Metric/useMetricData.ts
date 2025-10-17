import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  readMetricMetricsMetricIdGetOptions,
  readModelsModelsGetOptions,
  readStatusesStatusesGetOptions,
  readUsersUsersGetOptions,
  updateMetricMetricsMetricIdPutMutation,
} from '@/api-client/@tanstack/react-query.gen';

type MinimalMetric = {
  id: string;
  name: string | null;
  description: string | null;
  organization_id: string | null;
  user_id: string | null;
  tags: readonly { name: string }[] | null;
  evaluation_prompt: string | null;
  evaluation_steps: string | null;
  reasoning: string | null;
  model_id: string | null;
  score_type: 'binary' | 'numeric' | null;
  min_score: number | null;
  max_score: number | null;
  threshold: number | null;
  explanation: string | null;
};

type ModelOption = {
  id: string;
  name: string;
  description?: string | null;
};

export function useMetricData(metricId: string) {
  const qc = useQueryClient();

  const metricQuery = useQuery(
    readMetricMetricsMetricIdGetOptions({ path: { metric_id: metricId } }),
  );

  const statusesQuery = useQuery(
    readStatusesStatusesGetOptions({
      query: { entity_type: 'Metric', sort_by: 'name', sort_order: 'asc' },
    }),
  );

  const usersQuery = useQuery(
    readUsersUsersGetOptions({ query: { limit: 100, skip: 0 } }),
  );

  const modelsQuery = useQuery(
    readModelsModelsGetOptions({ query: { limit: 100, skip: 0 } }),
  );

  const updateMetric = useMutation({...updateMetricMetricsMetricIdPutMutation(),...{
      onSuccess: async () => {
        await Promise.all([
          qc.invalidateQueries({
            queryKey: readMetricMetricsMetricIdGetOptions({path: {metric_id: metricId}}).queryKey,
            exact: true,
          }),
        ]);
      },
    }});

  const metric: MinimalMetric | undefined = useMemo(() => {
    const m = metricQuery.data as any;
    if (!m) return undefined;
    return {
      id: m.id,
      name: m.name ?? null,
      description: m.description ?? null,
      organization_id: m.organization_id ?? null,
      user_id: m.user_id ?? null,
      tags: (m.tags ?? null) as MinimalMetric['tags'],
      evaluation_prompt: m.evaluation_prompt ?? null,
      evaluation_steps: m.evaluation_steps ?? null,
      reasoning: m.reasoning ?? null,
      model_id: m.model_id ?? null,
      score_type: (m.score_type ?? null) as MinimalMetric['score_type'],
      min_score: m.min_score ?? null,
      max_score: m.max_score ?? null,
      threshold: m.threshold ?? null,
      explanation: m.explanation ?? null,
    };
  }, [metricQuery.data]);

  const models: readonly ModelOption[] = useMemo(() => {
    const list = (modelsQuery.data?.data ?? []) as any[];
    return list.map((m) => ({
      id: String(m.id),
      name: String(m.name ?? ''),
      description: m.description ?? null,
    })) as readonly ModelOption[];
  }, [modelsQuery.data]);

  const isLoading =
    metricQuery.isLoading || statusesQuery.isLoading || usersQuery.isLoading;

  const refetchMetric = useCallback(() => metricQuery.refetch(), [metricQuery]);

  return {
    metric,
    models,
    isLoading,
    isError: Boolean(metricQuery.error),
    errorMessage:
      (metricQuery.error as Error | null)?.message ?? 'Failed to load metric',
    refetchMetric,
    updateMetric,
  };
}