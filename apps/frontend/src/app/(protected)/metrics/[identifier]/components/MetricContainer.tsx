'use client';

import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMetricData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import FeaturePageFrame, {
  GeneralSection,
  EvaluationSection,
  ConfigurationSection,
  EditableSection,
} from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import { StepperHeader } from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import type {
  UiEditableSectionType,
  UiFeaturePageFrameProps,
  UiGeneralSectionProps,
  UiEvaluationSectionProps,
  UiConfigurationSectionProps,
} from '../ui/types';

type Props = { identifier?: string };

export default function MetricContainer(props: Props) {
  const routeParams = useParams<{ identifier: string }>();
  const identifier = props.identifier ?? routeParams.identifier;
  const notifications = useNotifications();

  const { metric, models, isLoading, isError, errorMessage, refetchMetric, updateMetric } =
    useMetricData(identifier);

  const [editing, setEditing] = useState<UiEditableSectionType | null>(null);

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<readonly string[]>([]);
  const [modelId, setModelId] = useState<string | null>(null);
  const [evaluationPrompt, setEvaluationPrompt] = useState<string>('');
  const [steps, setSteps] = useState<readonly string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [scoreType, setScoreType] = useState<'binary' | 'numeric'>('binary');
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [maxScore, setMaxScore] = useState<number | undefined>(undefined);
  const [threshold, setThreshold] = useState<number | undefined>(undefined);
  const [explanation, setExplanation] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const tagEntity = useMemo(() => {
    if (!metric) return null;
    return {
      id: metric.id,
      organization_id: metric.organization_id ?? undefined,
      user_id: metric.user_id ?? undefined,
      tags: metric.tags ?? undefined,
    };
  }, [metric]);

  const populateForSection = useCallback(
    (section: UiEditableSectionType) => {
      if (!metric) return;

      if (section === 'general') {
        setName(metric.name ?? '');
        setDescription(metric.description ?? '');
        setTags((metric.tags ?? []).map((t) => t.name));
      } else if (section === 'evaluation') {
        setModelId(metric.model_id);
        setEvaluationPrompt(metric.evaluation_prompt ?? '');
        const parsedSteps =
          metric.evaluation_steps
            ?.split('\n---\n')
            .map((s: string) => s.replace(/^Step \d+:\n?/, '').trim()) ?? [];
        setSteps(parsedSteps);
        setReasoning(metric.reasoning ?? '');
      } else if (section === 'configuration') {
        setScoreType((metric.score_type ?? 'binary') as 'binary' | 'numeric');
        setMinScore(metric.min_score ?? undefined);
        setMaxScore(metric.max_score ?? undefined);
        setThreshold(metric.threshold ?? undefined);
        setExplanation(metric.explanation ?? '');
      }
    },
    [metric],
  );

  const onEdit = useCallback(
    (section: UiEditableSectionType) => {
      if (!metric) return;
      populateForSection(section);
      setEditing(section);
    },
    [metric, populateForSection],
  );

  const onCancel = useCallback(() => {
    setEditing(null);
  }, []);

  const onConfirm = useCallback(async () => {
    if (!metric || !editing) return;
    setSaving(true);
    try {
      const body: Record<string, string | number | 'binary' | 'numeric'> = {};

      if (editing === 'general') {
        body.name = name;
        body.description = description;
      }

      if (editing === 'evaluation') {
        if (modelId) body.model_id = modelId;
        body.evaluation_prompt = evaluationPrompt;
        body.reasoning = reasoning;
        const joined = (steps as string[])
          .map((s, i) => `Step ${i + 1}:\n${s}`)
          .join('\n---\n');
        body.evaluation_steps = joined;
      }

      if (editing === 'configuration') {
        body.score_type = scoreType;
        if (typeof minScore === 'number') body.min_score = minScore;
        if (typeof maxScore === 'number') body.max_score = maxScore;
        if (typeof threshold === 'number') body.threshold = threshold;
        body.explanation = explanation;
      }

      await updateMetric.mutateAsync({
        path: { metric_id: metric.id },
        body,
      });

      await refetchMetric();
      setEditing(null);
      notifications.show('Metric updated successfully', { severity: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update metric';
      notifications.show(msg, { severity: 'error' });
    } finally {
      setSaving(false);
    }
  }, [
    metric,
    editing,
    name,
    description,
    modelId,
    evaluationPrompt,
    reasoning,
    steps,
    scoreType,
    minScore,
    maxScore,
    threshold,
    explanation,
    updateMetric,
    refetchMetric,
    notifications,
  ]);

  const handleTagsChange = useCallback(async () => {
    try {
      await refetchMetric();
      notifications.show('Tags updated', { severity: 'success' });
    } catch {
      notifications.show('Failed to refresh tags', { severity: 'error' });
    }
  }, [refetchMetric, notifications]);

  if (isLoading) {
    return (
      <FeaturePageFrame
        {...({
          title: 'Loading…',
          breadcrumbs: [
            { title: 'Metrics', path: '/metrics' },
            { title: 'Loading…', path: `/metrics/${identifier}` },
          ],
        } satisfies UiFeaturePageFrameProps)}
      >
        <InlineLoader label="Loading metric details…" />
      </FeaturePageFrame>
    );
  }

  if (isError || !metric) {
    return (
      <FeaturePageFrame
        {...({
          title: 'Error',
          breadcrumbs: [
            { title: 'Metrics', path: '/metrics' },
            { title: 'Error', path: `/metrics/${identifier}` },
          ],
        } satisfies UiFeaturePageFrameProps)}
      >
        <ErrorBanner message={errorMessage} />
      </FeaturePageFrame>
    );
  }

  const frameProps = {
    title: metric.name ?? '',
    breadcrumbs: [
      { title: 'Metrics', path: '/metrics' },
      { title: metric.name ?? '', path: `/metrics/${identifier}` },
    ],
  } satisfies UiFeaturePageFrameProps;

  const generalProps = {
    isEditing: editing === 'general',
    name,
    description,
    tags,
    tagEntity,
    onNameChange: setName,
    onDescriptionChange: setDescription,
    onTagsChange: handleTagsChange,
  } satisfies UiGeneralSectionProps;

  const evaluationProps = {
    isEditing: editing === 'evaluation',
    modelId,
    models,
    evaluationPrompt,
    onModelChange: (id: string) => setModelId(id),
    onEvaluationPromptChange: setEvaluationPrompt,
    steps,
    onStepChange: (index: number, value: string) =>
      setSteps((prev) => prev.map((s, i) => (i === index ? value : s))),
    onAddStep: () => setSteps((prev) => [...prev, '']),
    onRemoveStep: (index: number) =>
      setSteps((prev) => prev.filter((_, i) => i !== index)),
    reasoning,
    onReasoningChange: setReasoning,
  } satisfies UiEvaluationSectionProps;

  const configurationProps = {
    isEditing: editing === 'configuration',
    scoreType,
    onScoreTypeChange: setScoreType,
    minScore,
    maxScore,
    threshold,
    onMinScoreChange: (n: number) => setMinScore(n),
    onMaxScoreChange: (n: number) => setMaxScore(n),
    onThresholdChange: (n: number) => setThreshold(n),
    explanation,
    onExplanationChange: setExplanation,
  } satisfies UiConfigurationSectionProps;

  return (
    <FeaturePageFrame {...frameProps}>
      <EditableSection
        title="General Information"
        icon={<StepperHeader icon="info" title="General Information" />}
        section="general"
        isEditingSection={editing}
        onEdit={onEdit}
        onCancel={onCancel}
        saving={saving}
        actionBar={
          editing === 'general' ? (
            <ActionBar saving={saving} onCancel={onCancel} onConfirm={onConfirm} />
          ) : null
        }
      >
        <GeneralSection {...generalProps} />
      </EditableSection>

      <EditableSection
        title="Evaluation Process"
        icon={<StepperHeader icon="assessment" title="Evaluation Process" />}
        section="evaluation"
        isEditingSection={editing}
        onEdit={onEdit}
        onCancel={onCancel}
        saving={saving}
        actionBar={
          editing === 'evaluation' ? (
            <ActionBar saving={saving} onCancel={onCancel} onConfirm={onConfirm} />
          ) : null
        }
      >
        <EvaluationSection {...evaluationProps} />
      </EditableSection>

      <EditableSection
        title="Result Configuration"
        icon={<StepperHeader icon="settings" title="Result Configuration" />}
        section="configuration"
        isEditingSection={editing}
        onEdit={onEdit}
        onCancel={onCancel}
        saving={saving}
        actionBar={
          editing === 'configuration' ? (
            <ActionBar saving={saving} onCancel={onCancel} onConfirm={onConfirm} />
          ) : null
        }
      >
        <ConfigurationSection {...configurationProps} />
      </EditableSection>
    </FeaturePageFrame>
  );
}