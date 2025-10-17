import type { Meta, StoryObj } from '@storybook/react';
import { StepConfigureGeneration } from '../steps/StepConfigureGeneration';

const meta = {
  title: 'GenerateTests/StepConfigureGeneration',
  component: StepConfigureGeneration,
} satisfies Meta<typeof StepConfigureGeneration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    projects: [{ id: '1', name: 'Demo Project' }],
    behaviors: [{ id: 'b1', name: 'Reliability' }, { id: 'b2', name: 'Safety' }],
    isLoading: false,
    error: null,
    configData: {
      project_name: 'Demo Project',
      behaviors: ['Reliability'],
      purposes: ['Regression Testing'],
      test_type: 'single_turn',
      response_generation: 'prompt_only',
      test_coverage: 'focused',
      tags: ['auth', 'payments'],
      description: 'Ensure checkout is robust',
    },
    onConfigChange: () => {},
    onSubmit: () => {},
    supportedExtensions: ['.pdf', '.docx'],
    toPromptPreview: () => ({}),
  },
};