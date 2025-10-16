import type { Meta, StoryObj } from '@storybook/react';
import StepResponseSettings from '../steps/StepResponseSettings';

const meta = {
  title: 'Endpoints/StepResponseSettings',
  component: StepResponseSettings,
} satisfies Meta<typeof StepResponseSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    response_mappings: '{ "output": "$.choices[0].message.content" }',
    onChange: () => {},
  },
};