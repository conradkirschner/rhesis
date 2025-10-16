import type { Meta, StoryObj } from '@storybook/react';
import { StepForm } from '../../ui/steps/StepForm';

const meta: Meta<typeof StepForm> = {
  title: 'Tasks/Create/StepForm',
  component: StepForm,
};
export default meta;

type Story = StoryObj<typeof StepForm>;

export const Default: Story = {
  args: {
    form: {
      title: '',
      description: '',
      statusId: '',
      priorityId: '',
      assigneeId: undefined,
      entityType: 'Task',
      entityId: '123',
      commentId: undefined,
    },
    users: [
      { id: 'u1', label: 'Ada Lovelace' },
      { id: 'u2', label: 'Grace Hopper' },
    ],
    statusOptions: [
      { id: 's1', name: 'Open' },
      { id: 's2', name: 'In Progress' },
    ],
    priorityOptions: [
      { id: 'p1', label: 'Low' },
      { id: 'p2', label: 'Medium' },
      { id: 'p3', label: 'High' },
    ],
    isSaving: false,
    onChange: () => {},
  },
};