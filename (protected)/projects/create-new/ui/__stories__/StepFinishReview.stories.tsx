import type { Meta, StoryObj } from '@storybook/react';
import StepFinishReview from '../steps/StepFinishReview';

const meta = {
  title: 'CreateProject/StepFinishReview',
  component: StepFinishReview,
} satisfies Meta<typeof StepFinishReview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    form: {
      projectName: 'My Project',
      description: 'A sample description',
      icon: 'SmartToy',
    },
    owner: {
      name: 'Alice',
    },
    isOwnerLoading: false,
  },
};