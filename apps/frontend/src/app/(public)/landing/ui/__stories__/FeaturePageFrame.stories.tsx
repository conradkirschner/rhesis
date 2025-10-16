import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';

const meta = {
  title: 'Landing/FeaturePageFrame',
  component: FeaturePageFrame,
} satisfies Meta<typeof FeaturePageFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPlaceholderRight: Story = {
  args: {
    right: <div>Right side content</div>,
  },
};