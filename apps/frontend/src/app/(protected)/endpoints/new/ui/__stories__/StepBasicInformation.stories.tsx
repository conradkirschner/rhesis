import type { Meta, StoryObj } from '@storybook/react';
import StepBasicInformation from '../steps/StepBasicInformation';

const meta = {
  title: 'Endpoints/StepBasicInformation',
  component: StepBasicInformation,
} satisfies Meta<typeof StepBasicInformation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: '',
    description: '',
    url: '',
    urlError: null,
    protocol: 'REST',
    method: 'POST',
    environment: 'development',
    environments: ['production', 'staging', 'development'],
    protocols: ['REST'],
    methods: ['POST'],
    projects: [{ id: '1', name: 'Project A', description: 'Demo', icon: 'SmartToy' }],
    projectId: '',
    onChange: () => {},
  },
};