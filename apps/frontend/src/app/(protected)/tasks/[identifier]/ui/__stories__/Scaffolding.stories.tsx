import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../../ui/FeaturePageFrame';
import StepperHeader from '../../ui/StepperHeader';
import ActionBar from '../../ui/ActionBar';

const meta = {
  title: 'Tasks/Scaffolding',
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const FrameWithHeaderAndAction: Story = {
  render: () => (
    <FeaturePageFrame title="Task" breadcrumbs={[{ title: 'Tasks', path: '/tasks' }, { title: 'Task', path: '/tasks/t1' }]}>
      <StepperHeader title="Task title" subtitle="Task details" />
      <ActionBar primaryLabel="Back to Tasks" onPrimary={() => {}} />
    </FeaturePageFrame>
  ),
};