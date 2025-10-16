import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';

const meta = {
  title: 'Onboarding/FeaturePageFrame',
  component: FeaturePageFrame,
} satisfies Meta<typeof FeaturePageFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Welcome to Rhesis',
    subtitle: 'Just a few steps',
    steps: ['Organization Details', 'Invite Team', 'Finish'],
    activeStep: 0,
    children: 'Content',
  },
};