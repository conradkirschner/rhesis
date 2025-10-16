import type { Meta, StoryObj } from '@storybook/react';
import StepProjectDetails from '../steps/StepProjectDetails';

const meta = {
  title: 'CreateProject/StepProjectDetails',
  component: StepProjectDetails,
} satisfies Meta<typeof StepProjectDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    owners: [{ id: 'u1', name: 'Alice', picture: '' }] as const,
    form: {
      projectName: '',
      description: '',
      icon: 'SmartToy',
      ownerId: 'u1',
    },
    onFormChange: () => {},
  },
};