import type { Meta, StoryObj } from '@storybook/react';
import StepTestConnection from '../steps/StepTestConnection';

const meta = {
  title: 'Endpoints/Steps/TestConnection',
  component: StepTestConnection,
} satisfies Meta<typeof StepTestConnection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    testInput: '{\n  "input": "hello"\n}',
    onChange: () => {},
    onTest: () => {},
    testResponse: '{\n  "ok": true\n}',
    isTesting: false,
  },
};