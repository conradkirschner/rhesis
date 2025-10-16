import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  readModelsModelsGetOptions,
  createMetricMetricsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import type { ScoreType } from '@/api-client/types.gen';
import { formatEvaluationSteps } from '../../../lib/metrics/formatEvaluationSteps';

type ModelDto = {
  id: string;
  name: string;
  description?: string | null;
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

  const modelsQueryOpts = readModelsModelsGetOptions({
    query: { sort_by: 'name', sort_order: 'asc', skip: 0, limit: 100 },
  });

  const modelsQuery = useQuery({
    ...modelsQueryOpts,
    enabled: options?.enabled ?? true,
    select: (res): readonly ModelDto[] => res.data,
    staleTime: 5 * 60 * 1000,
  });

  const createMetric = useMutation(createMetricMetricsPostMutation(), {
    onSuccess: async () => {
      // Invalidate minimal affected data (directory/listing if present in app)
      await qc.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const models = useMemo(
    () =>
      (modelsQuery.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description ?? undefined,
      })),
    [modelsQuery.data],
  );

  const create = async (input: CreateMetricInput) => {
    const formattedSteps = formatEvaluationSteps(input.evaluation_steps);
    await createMetric.mutateAsync({
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
  };

  return {
    models,
    isLoadingModels: modelsQuery.isPending,
    isCreating: createMetric.isPending,
    create,
  } as const;
}