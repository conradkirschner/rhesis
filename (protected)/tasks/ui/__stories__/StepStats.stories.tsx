import type { Meta, StoryObj } from '@storybook/react';
import StepStats from '../steps/StepStats';

const meta: Meta<typeof StepStats> = {
  title: 'Tasks/StepStats',
  component: StepStats,
};
export default meta;

type Story = StoryObj<typeof StepStats>;

export const Default: Story = {
  args: {
    total: 42,
    open: 10,
    inProgress: 20,
    completed: 10,
    cancelled: 2,
    loading: false,
    updating: false,
    errorMessage: undefined,
  },
};