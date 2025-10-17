import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';
import type { UiFeaturePageFrameProps } from '../types';

const meta = {
  title: 'Integrations/LLM Providers/FeaturePageFrame',
  component: FeaturePageFrame,
} satisfies Meta<typeof FeaturePageFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseProps: UiFeaturePageFrameProps = {
  title: 'LLM Providers',
  subtitle: 'Connect to AI providers to power your workflows.',
  loading: false,
  providers: [
    { id: '1', code: 'openai', label: 'OpenAI' },
    { id: '2', code: 'anthropic', label: 'Anthropic' },
  ],
  models: [
    { id: 'm1', name: 'Prod OpenAI', description: 'Primary model', icon: 'openai', modelName: 'gpt-4o', keySuffix: '1a2b' },
    { id: 'm2', name: 'Anthropic Dev', description: 'Claude model', icon: 'anthropic', modelName: 'claude-3.5', keySuffix: '9z9z' },
  ],
  actions: { onAdd: () => {} },
  dialogs: {
    selectOpen: false,
    onCloseSelect: () => {},
    onSelectProvider: () => {},
    connectOpen: false,
    selectedProvider: null,
    onCloseConnect: () => {},
    onSubmitConnect: async () => {},
    deleteOpen: false,
    onRequestDelete: () => {},
    onCloseDelete: () => {},
    onConfirmDelete: () => {},
  },
};

export const Default: Story = {
  args: baseProps,
};

export const Loading: Story = {
  args: { ...baseProps, loading: true },
};

export const Error: Story = {
  args: { ...baseProps, errorMessage: 'Failed to load providers.' },
};