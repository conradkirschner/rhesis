import type { Meta, StoryObj } from '@storybook/react';
import StepResponseSettings from '../steps/StepResponseSettings';

const meta = {
  title: 'Endpoints/Steps/ResponseSettings',
  component: StepResponseSettings,
} satisfies Meta<typeof StepResponseSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isEditing: true,
    responseMappings: '{\n  "output": "$.data.result"\n}',
    onChange: () => {},
  },
};