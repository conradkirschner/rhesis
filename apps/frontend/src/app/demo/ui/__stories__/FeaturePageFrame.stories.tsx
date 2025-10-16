import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';

const meta = {
  title: 'Demo/FeaturePageFrame',
  component: FeaturePageFrame,
} satisfies Meta<typeof FeaturePageFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showBackground: true,
    children: <div>Content</div>,
  },
};