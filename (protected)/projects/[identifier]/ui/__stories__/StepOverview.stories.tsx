import type { Meta, StoryObj } from '@storybook/react';
import StepOverview from '../../steps/StepOverview';

const meta: Meta<typeof StepOverview> = {
  title: 'Projects/StepOverview',
  component: StepOverview,
};
export default meta;

type Story = StoryObj<typeof StepOverview>;

export const Viewing: Story = {
  args: {
    isEditing: false,
    users: [],
    fields: {
      name: 'Demo Project',
      description: 'This is a demo project.',
      ownerId: 'owner_123',
      isActive: true,
      icon: 'SmartToy',
    },
    onChange: () => {},
  },
};

export const Editing: Story = {
  args: {
    isEditing: true,
    users: [],
    fields: {
      name: 'Editable Project',
      description: 'Edit me.',
      ownerId: 'owner_123',
      isActive: false,
      icon: 'Web',
    },
    onChange: () => {},
  },
};