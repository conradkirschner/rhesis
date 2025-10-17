import type { Meta, StoryObj } from '@storybook/react';
import StepTestConnection from '../steps/StepTestConnection';

const meta = {
  title: 'Endpoints/StepTestConnection',
  component: StepTestConnection,
} satisfies Meta<typeof StepTestConnection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isTesting: false,
    response: '{ "success": true }',
    onTest: () => {},
  },
};