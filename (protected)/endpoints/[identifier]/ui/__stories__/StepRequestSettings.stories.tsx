import type { Meta, StoryObj } from '@storybook/react';
import StepRequestSettings from '../../steps/StepRequestSettings';

const meta = {
  title: 'Endpoints/Steps/RequestSettings',
  component: StepRequestSettings,
} satisfies Meta<typeof StepRequestSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isEditing: true,
    requestHeaders: '{\n  "Authorization": "Bearer <token>"\n}',
    requestBodyTemplate: '{\n  "userId": "{{user.id}}"\n}',
    onChange: () => {},
  },
};