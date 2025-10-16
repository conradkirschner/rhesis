import type { Meta, StoryObj } from '@storybook/react';
import StepCredentials from '../steps/StepCredentials';

const meta = {
  title: 'Demo/Steps/Credentials',
  component: StepCredentials,
} satisfies Meta<typeof StepCredentials>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: 'demo@rhesis.ai',
    password: 'PlatypusDemo!',
    onContinue: () => {},
  },
};