import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../../ui/FeaturePageFrame';

const meta: Meta<typeof FeaturePageFrame> = {
  title: 'TestSets/FeaturePageFrame',
  component: FeaturePageFrame,
};
export default meta;

export const Default: StoryObj<typeof FeaturePageFrame> = {
  args: {
    title: 'Test Set ABC',
    breadcrumbs: [
      { title: 'Test Sets', path: '/test-sets' },
      { title: 'Test Set ABC', path: '/test-sets/abc' },
    ],
    children: 'Content',
  },
};