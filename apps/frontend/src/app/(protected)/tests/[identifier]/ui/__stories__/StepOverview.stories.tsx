import type { Meta, StoryObj } from '@storybook/react';
import StepOverview, { type UiStepOverviewProps } from '../steps/StepOverview';

const meta: Meta<typeof StepOverview> = {
  title: 'Tests/StepOverview',
  component: StepOverview,
};
export default meta;

type Story = StoryObj<typeof StepOverview>;

const baseProps: UiStepOverviewProps = {
  id: 'test-123',
  title: 'Unit Test: Payments Flow',
  status: 'active',
  createdAtISO: new Date('2025-01-01T12:00:00Z').toISOString(),
  owner: { id: 'u1', name: 'Ada Lovelace', avatarUrl: '' },
  currentUser: { id: 'me', name: 'You' },
};

export const Default: Story = { args: baseProps };
export const WithoutOwner: Story = { args: { ...baseProps, owner: null } };