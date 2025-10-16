import type { Meta, StoryObj } from '@storybook/react';
import StepProjectsGrid from '../steps/StepProjectsGrid';
import type { UiProject } from '../types';

const meta: Meta<typeof StepProjectsGrid> = {
  title: 'Projects/StepProjectsGrid',
  component: StepProjectsGrid,
};
export default meta;

type Story = StoryObj<typeof StepProjectsGrid>;

const sampleProjects: readonly UiProject[] = [
  {
    id: '1',
    name: 'Vision Assistant',
    description: 'An AI project for visual recognition.',
    isActive: true,
    createdAt: new Date().toISOString(),
    owner: { name: 'Alice' },
  },
  {
    id: '2',
    name: 'Chatbot Platform',
    description: 'Customer support chatbot.',
    isActive: false,
    createdAt: new Date().toISOString(),
    owner: { name: 'Bob' },
  },
];

export const Default: Story = {
  args: {
    projects: sampleProjects,
    onView: () => {},
  },
};