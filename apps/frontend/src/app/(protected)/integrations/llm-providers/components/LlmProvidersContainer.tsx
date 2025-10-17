'use client';

import { useMemo, useState } from 'react';
import { useLlmProvidersData } from '@/hooks/data';
import type {
  UiActionBarProps,
  UiFeaturePageFrameProps,
  UiModelCard,
  UiProvider,
  UiConnectForm,
} from '../ui/types';
import FeaturePageFrame from '../ui/FeaturePageFrame';

export default function LlmProvidersContainer() {
  const { providers, models, isLoading, errorMessage, createConnection, deleteConnection } =
    useLlmProvidersData();

  const [selectOpen, setSelectOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [modelToDeleteId, setModelToDeleteId] = useState<string | null>(null);

  const uiProviders = useMemo(() => {
    const shaped = providers
      .map<UiProvider>((p) => ({
        id: p.id,
        code: p.code,
        label: p.label,
      }))
      .sort((a, b) => a.code.localeCompare(b.code)) as readonly UiProvider[];
    return shaped;
  }, [providers]);

  const uiModels = useMemo(() => {
    const shaped = models.map<UiModelCard>((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon ?? undefined,
      modelName: m.modelName,
      keySuffix: m.keySuffix ?? undefined,
    })) as readonly UiModelCard[];
    return shaped;
  }, [models]);

  const selectedProvider = useMemo(
    () => uiProviders.find((p) => p.id === selectedProviderId) ?? null,
    [uiProviders, selectedProviderId],
  );

  const actions: UiActionBarProps = {
    onAdd: () => setSelectOpen(true),
  } satisfies UiActionBarProps;

  const frameProps: UiFeaturePageFrameProps = {
    title: 'LLM Providers',
    subtitle:
      'Connect to AI providers to power your evaluation and testing workflows.',
    loading: isLoading,
    errorMessage: errorMessage ?? undefined,
    providers: uiProviders,
    models: uiModels,
    actions,
    dialogs: {
      selectOpen,
      onCloseSelect: () => setSelectOpen(false),
      onSelectProvider: (providerId) => {
        setSelectedProviderId(providerId);
        setSelectOpen(false);
        setConnectOpen(true);
      },

      connectOpen,
      selectedProvider,
      onCloseConnect: () => {
        setConnectOpen(false);
        setSelectedProviderId(null);
      },
      onSubmitConnect: async (form: UiConnectForm) => {
        const headers = {
          Authorization: `Bearer ${form.apiKey}`,
          'Content-Type': 'application/json',
          ...form.customHeaders,
        };
        await createConnection({
          name: form.connectionName,
          description: `${form.providerLabel} Connection`,
          icon: form.providerIcon ?? null,
          modelName: form.modelName,
          endpoint: form.endpoint,
          key: form.apiKey,
          requestHeaders: headers,
          providerTypeId: form.providerTypeId,
        });
        setConnectOpen(false);
        setSelectedProviderId(null);
      },

      deleteOpen,
      onRequestDelete: (modelId) => {
        setModelToDeleteId(modelId);
        setDeleteOpen(true);
      },
      onCloseDelete: () => {
        setDeleteOpen(false);
        setModelToDeleteId(null);
      },
      onConfirmDelete: async () => {
        if (!modelToDeleteId) return;
        await deleteConnection(modelToDeleteId);
        setDeleteOpen(false);
        setModelToDeleteId(null);
      },
    },
  } satisfies UiFeaturePageFrameProps;

  return <FeaturePageFrame {...frameProps} />;
}