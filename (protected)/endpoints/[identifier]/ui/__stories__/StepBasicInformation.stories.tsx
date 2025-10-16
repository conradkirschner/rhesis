import type { Meta, StoryObj } from '@storybook/react';
import StepBasicInformation from '../../steps/StepBasicInformation';

const meta = {
  title: 'Endpoints/Steps/BasicInformation',
  component: StepBasicInformation,
} satisfies Meta<typeof StepBasicInformation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isEditing: true,
    values: {
      name: 'Orders API',
      description: 'Handles order operations',
      url: 'https://api.example.com/orders',
      protocol: 'REST',
      method: 'POST',
      environment: 'staging',
      projectId: 'p1',
    },
    projects: [
      { id: 'p1', name: 'Shop', description: 'Main shop', iconKey: 'ShoppingCart' },
      { id: 'p2', name: 'Analytics', description: 'BI', iconKey: 'Analytics' },
    ],
    onChange: () => {},
  },
};