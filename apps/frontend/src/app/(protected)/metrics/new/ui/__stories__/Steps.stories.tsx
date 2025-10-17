import type { Meta, StoryObj } from '@storybook/react';
import StepMetricInformation from '../steps/StepMetricInformation';
import StepConfirmation from '../steps/StepConfirmation';

const meta: Meta = {
  title: 'Metrics/New/Steps',
} satisfies Meta;

export default meta;

export const MetricInformation: StoryObj = {
  render: () => (
    <StepMetricInformation
      form={{
        name: 'Helpfulness',
        description: 'Evaluates how helpful the answer is.',
        tags: ['qa', 'helpfulness'],
        evaluation_prompt: 'Assess helpfulness...',
        evaluation_steps: ['Read the answer', 'Check relevance'],
        reasoning: 'Consider clarity and completeness.',
        score_type: 'binary',
        explanation: 'Explain why it passes or fails.',
        model_id: '',
      }}
      models={[
        { id: '1', name: 'gpt-4o' },
        { id: '2', name: 'llama-3' },
      ]}
      isLoadingModels={false}
      onFieldChange={() => {}}
      onStepChange={() => {}}
      onAddStep={() => {}}
      onRemoveStep={() => {}}
    />
  ),
};

export const Confirmation: StoryObj = {
  render: () => (
    <StepConfirmation
      form={{
        name: 'Helpfulness',
        description: 'Evaluates how helpful the answer is.',
        tags: ['qa', 'helpfulness'],
        evaluation_prompt: 'Assess helpfulness...',
        evaluation_steps: ['Read the answer', 'Check relevance'],
        reasoning: 'Consider clarity and completeness.',
        score_type: 'numeric',
        min_score: 0,
        max_score: 10,
        threshold: 7,
        explanation: 'Explain the numeric score.',
        model_id: '1',
      }}
      models={[{ id: '1', name: 'gpt-4o' }]}
    />
  ),
};