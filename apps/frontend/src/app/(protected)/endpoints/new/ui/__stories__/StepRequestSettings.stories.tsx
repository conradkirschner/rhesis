import type { Meta, StoryObj } from '@storybook/react';
import StepRequestSettings from '../steps/StepRequestSettings';

const meta = {
  title: 'Endpoints/StepRequestSettings',
  component: StepRequestSettings,
} satisfies Meta<typeof StepRequestSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    request_headers: '{\n  "Content-Type": "application/json"\n}',
    request_body_template: '{\n  "messages": []\n}',
    onChange: () => {},
  },
};