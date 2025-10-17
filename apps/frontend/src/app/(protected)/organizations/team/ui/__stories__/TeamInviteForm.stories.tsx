import type { Meta, StoryObj } from '@storybook/react';
import TeamInviteForm from '../../ui/TeamInviteForm';

const meta: Meta<typeof TeamInviteForm> = {
  title: 'Organizations/TeamInviteForm',
  component: TeamInviteForm,
};
export default meta;

type Story = StoryObj<typeof TeamInviteForm>;

export const Default: Story = {
  args: {
    invites: [{ email: '' }],
    onChangeEmail: () => {},
    onAdd: () => {},
    onRemove: () => {},
    onSubmit: () => {},
    isSubmitting: false,
    maxInvites: 10,
  },
};