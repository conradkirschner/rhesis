'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMetricsData } from '@/src/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepMetricInformation from '../ui/steps/StepMetricInformation';
import StepConfirmation from '../ui/steps/StepConfirmation';
import type {
  UiMetricForm,
  UiModelOption,
  UiScoreType,
} from '../ui/types';

const steps = ['Metric Information and Criteria', 'Confirmation'] as const;

const initialForm: UiMetricForm = {
  name: '',
  description: '',
  tags: [],
  evaluation_prompt: '',
  evaluation_steps: [''],
  reasoning: '',
  score_type: 'binary',
  explanation: '',
  model_id: '',
};

export default function MetricsContainer() {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: session } = useSession();
  const notifications = useNotifications();

  const [activeStep, setActiveStep] = React.useState(0);
  const [form, setForm] = React.useState<UiMetricForm>(initialForm);

  const { models, isLoadingModels, isCreating, create } = useMetricsData({
    enabled: !!session?.session_token,
  });

  const modelsUi = models.map((m) => ({ id: m.id, name: m.name, description: m.description })) satisfies readonly UiModelOption[];

  const type = sp.get('type') ?? undefined;

  React.useEffect(() => {
    if (!type) router.push('/metrics');
  }, [type, router]);

  const title =
    type === 'grading'
      ? 'Create Grading Criteria Metric'
      : type === 'api-call'
      ? 'Create API Call Metric'
      : type === 'custom-code'
      ? 'Create Custom Code Metric'
      : type === 'custom-prompt'
      ? 'Create Custom Prompt Metric'
      : type === 'framework'
      ? 'Create Framework Metric'
      : 'Create New Metric';

  const onFieldChange = <K extends keyof UiMetricForm>(key: K, value: UiMetricForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onStepChange = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.evaluation_steps];
      next[index] = value;
      return { ...prev, evaluation_steps: next };
    });
  };

  const onAddStep = () => {
    setForm((prev) => ({ ...prev, evaluation_steps: [...prev.evaluation_steps, ''] }));
  };

  const onRemoveStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      evaluation_steps: prev.evaluation_steps.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => s - 1);

  const handleCancel = () => router.push('/metrics');

  const handleSubmit = async () => {
    if (!type) return;
    try {
      await create({
        name: form.name,
        description: form.description || '',
        evaluation_prompt: form.evaluation_prompt,
        evaluation_steps: form.evaluation_steps,
        reasoning: form.reasoning || '',
        score_type: form.score_type as UiScoreType,
        min_score: form.score_type === 'numeric' ? form.min_score : undefined,
        max_score: form.score_type === 'numeric' ? form.max_score : undefined,
        threshold: form.score_type === 'numeric' ? form.threshold : undefined,
        explanation: form.explanation || '',
        model_id: form.model_id || '',
        owner_id: session?.user?.id || undefined,
      });
      notifications.show('Metric created successfully', { severity: 'success' });
      router.push('/metrics?tab=directory');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create metric';
      notifications.show(message, { severity: 'error' });
    }
  };

  const StepMap: Record<number, React.ReactNode> = {
    0: (
      <StepMetricInformation
        form={form}
        models={modelsUi}
        isLoadingModels={isLoadingModels}
        onFieldChange={onFieldChange}
        onStepChange={onStepChange}
        onAddStep={onAddStep}
        onRemoveStep={onRemoveStep}
      />
    ),
    1: (
      <StepConfirmation
        form={form}
        models={modelsUi}
      />
    ),
  };

  return (
    <FeaturePageFrame
      title={title}
      breadcrumbs={[
        { title: 'Metrics', path: '/metrics' },
        { title: 'New Metric' },
      ]}
    >
      <StepperHeader steps={steps} activeStep={activeStep} />
      {isLoadingModels && <InlineLoader label="Loading models..." />}
      {!isLoadingModels && StepMap[activeStep]}
      {!type && <ErrorBanner message="Invalid metric type." />}
      <ActionBar
        isLoadingAction={isCreating}
        canGoBack
        backLabel={activeStep === 0 ? 'Cancel' : 'Back'}
        onBack={activeStep === 0 ? handleCancel : handleBack}
        primaryLabel={activeStep === steps.length - 1 ? (isCreating ? 'Creating...' : 'Create Metric') : 'Next'}
        primaryDisabled={
          isCreating ||
          (activeStep === steps.length - 1
            ? !form.name || !form.evaluation_prompt || !form.model_id
            : false)
        }
        onPrimary={activeStep === steps.length - 1 ? handleSubmit : handleNext}
      />
    </FeaturePageFrame>
  );
}