import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame, {
  EditableSection,
  GeneralSection,
  EvaluationSection,
  ConfigurationSection,
} from '../FeaturePageFrame';
import ActionBar from '../ActionBar';

const meta = {
  title: 'Metrics/Metric Detail',
  component: FeaturePageFrame,
} satisfies Meta<typeof FeaturePageFrame>;

export default meta;
type Story = StoryObj<typeof FeaturePageFrame>;

export const FullPage: Story = {
  render: () => (
    <FeaturePageFrame
      title="Toxicity"
      breadcrumbs={[
        { title: 'Metrics', path: '/metrics' },
        { title: 'Toxicity', path: '/metrics/abc' },
      ]}
    >
      <EditableSection
        title="General Information"
        icon={<span />}
        section="general"
        isEditingSection={'general'}
        onEdit={() => {}}
        onCancel={() => {}}
        saving={false}
        actionBar={<ActionBar saving={false} onCancel={() => {}} onConfirm={() => {}} />}
      >
        <GeneralSection
          isEditing
          name="Toxicity"
          description="Detects if the response contains toxicity"
          tags={['nlp', 'filter']}
          tagEntity={{ id: '1' }}
          onNameChange={() => {}}
          onDescriptionChange={() => {}}
          onTagsChange={() => {}}
        />
      </EditableSection>

      <EditableSection
        title="Evaluation Process"
        icon={<span />}
        section="evaluation"
        isEditingSection={'evaluation'}
        onEdit={() => {}}
        onCancel={() => {}}
        saving={false}
        actionBar={<ActionBar saving={false} onCancel={() => {}} onConfirm={() => {}} />}
      >
        <EvaluationSection
          isEditing
          modelId="m1"
          models={[
            { id: 'm1', name: 'gpt-4o' },
            { id: 'm2', name: 'claude' },
          ]}
          evaluationPrompt="Judge the output."
          onModelChange={() => {}}
          onEvaluationPromptChange={() => {}}
          steps={['Analyze', 'Score']}
          onStepChange={() => {}}
          onAddStep={() => {}}
          onRemoveStep={() => {}}
          reasoning="Provide a structured explanation."
          onReasoningChange={() => {}}
        />
      </EditableSection>

      <EditableSection
        title="Result Configuration"
        icon={<span />}
        section="configuration"
        isEditingSection={'configuration'}
        onEdit={() => {}}
        onCancel={() => {}}
        saving={false}
        actionBar={<ActionBar saving={false} onCancel={() => {}} onConfirm={() => {}} />}
      >
        <ConfigurationSection
          isEditing
          scoreType="numeric"
          onScoreTypeChange={() => {}}
          minScore={0}
          maxScore={100}
          threshold={50}
          onMinScoreChange={() => {}}
          onMaxScoreChange={() => {}}
          onThresholdChange={() => {}}
          explanation="Scores ≥ 50 pass."
          onExplanationChange={() => {}}
        />
      </EditableSection>
    </FeaturePageFrame>
  ),
};