import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';

const meta: Meta<typeof FeaturePageFrame> = {
  title: 'Endpoints/FeaturePageFrame',
  component: FeaturePageFrame,
};
export default meta;

type Story = StoryObj<typeof FeaturePageFrame>;

export const Default: Story = {
  args: {
    title: 'Endpoints',
    breadcrumbs: [{ title: 'Endpoints' }],
    children: 'Content',
  },
};