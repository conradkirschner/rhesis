import type { Meta, StoryObj } from '@storybook/react';
import StepDetails from '../../ui/steps/StepDetails';

const meta = {
  title: 'Tasks/StepDetails',
  component: StepDetails,
} satisfies Meta<typeof StepDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    task: {
      id: 't1',
      title: 'Fix onboarding bug',
      description: 'Reproduce and fix the bug where users cannot finish onboarding.',
      statusId: 'in_progress',
      priorityId: 'high',
      assigneeId: '',
      creator: { id: 'u1', name: 'Alex Doe' },
      entityType: 'Project',
      entityId: 'p1',
    },
    users: [
      { id: 'u1', name: 'Alex Doe' },
      { id: 'u2', name: 'Jamie Lynn' },
    ],
    isSaving: false,
    isUsersLoading: false,
    onChangeStatus: () => {},
    onChangePriority: () => {},
    onChangeAssignee: () => {},
    onSaveTitle: () => {},
    onSaveDescription: () => {},
  },
};