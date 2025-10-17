import type { Meta, StoryObj } from '@storybook/react';
import ActionBar from '../ActionBar';

const meta: Meta<typeof ActionBar> = {
  title: 'Projects/ActionBar',
  component: ActionBar,
};
export default meta;

type Story = StoryObj<typeof ActionBar>;

export const ViewMode: Story = {
  args: {
    mode: 'view',
    disabled: false,
    onEdit: () => {},
    onSave: () => {},
    onCancel: () => {},
    onDelete: () => {},
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    disabled: false,
    onEdit: () => {},
    onSave: () => {},
    onCancel: () => {},
    onDelete: () => {},
  },
};