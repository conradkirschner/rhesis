import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  readModelsModelsGetOptions,
  readTypeLookupsTypeLookupsGetOptions,
  createModelModelsPostMutation,
  deleteModelModelsModelIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

/**
 * Fetches providers and connected models and exposes create/delete fns.
 */
export function useLlmProvidersData(args?: { readonly enabled?: boolean }) {
  const enabled = args?.enabled ?? true;
  const qc = useQueryClient();

  const providersQuery = useQuery({
    ...readTypeLookupsTypeLookupsGetOptions({
      query: { $filter: "type_name eq 'ProviderType'" },
    }),
    enabled,
    staleTime: 5 * 60_000,
  });

  const modelsQuery = useQuery({
    ...readModelsModelsGetOptions(),
    enabled,
    staleTime: 60_000,
  });

  const createModel = useMutation({
    ...createModelModelsPostMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: readModelsModelsGetOptions().queryKey,
      });
    },
  });

  const deleteModel = useMutation({
    ...deleteModelModelsModelIdDeleteMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: readModelsModelsGetOptions().queryKey,
      });
    },
  });

  const providers = useMemo(
    () =>
      (providersQuery.data as { data?: Array<{ id: string; type_value: string; description?: string | null }> } | undefined)
        ?.data?.map((p) => ({
          id: String(p.id),
          code: p.type_value,
          label: p.description ?? p.type_value,
        })) ?? [],
    [providersQuery.data],
  ) as ReadonlyArray<{ id: string; code: string; label: string }>;

  const models = useMemo(
    () =>
      (modelsQuery.data as { data?: Array<{ id: string; name: string; description?: string | null; icon?: string | null; model_name: string; key?: string | null }> } | undefined)
        ?.data?.map((m) => ({
          id: String(m.id),
          name: m.name,
          description: m.description ?? undefined,
          icon: m.icon ?? null,
          modelName: m.model_name,
          keySuffix: m.key ? m.key.slice(-4) : null,
        })) ?? [],
    [modelsQuery.data],
  ) as ReadonlyArray<{
    id: string;
    name: string;
    description?: string;
    icon?: string | null;
    modelName: string;
    keySuffix?: string | null;
  }>;

  return {
    providers,
    models,
    isLoading: providersQuery.isLoading || modelsQuery.isLoading,
    errorMessage:
      (providersQuery.error && (providersQuery.error as Error).message) ||
      (modelsQuery.error && (modelsQuery.error as Error).message) ||
      null,
    createConnection: async (input: {
      readonly name: string;
      readonly description?: string;
      readonly icon?: string | null;
      readonly modelName: string;
      readonly endpoint: string;
      readonly key: string;
      readonly requestHeaders: Record<string, string>;
      readonly providerTypeId: string;
    }) => {
      await createModel.mutateAsync({
        body: {
          name: input.name,
          description: input.description,
          icon: input.icon ?? undefined,
          model_name: input.modelName,
          endpoint: input.endpoint,
          key: input.key,
          request_headers: input.requestHeaders,
          provider_type_id: input.providerTypeId,
        },
      });
    },
    deleteConnection: async (id: string) => {
      await deleteModel.mutateAsync({ path: { model_id: id } });
    },
  };
}

export type LlmProviderShape = ReturnType<typeof useLlmProvidersData>['providers'][number];
export type LlmModelShape = ReturnType<typeof useLlmProvidersData>['models'][number];