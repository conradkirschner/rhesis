import type { Meta, StoryObj } from '@storybook/react';
import { StepOrganizationDetails } from '../steps/StepOrganizationDetails';
import { StepInviteTeam } from '../steps/StepInviteTeam';
import { StepFinish } from '../steps/StepFinish';

export default {
  title: 'Onboarding/Steps',
} satisfies Meta;

type Story = StoryObj;

export const OrganizationDetails: Story = {
  render: () => (
    <StepOrganizationDetails
      formData={{ firstName: '', lastName: '', organizationName: '', website: '', invites: [{ email: '' }] }}
      onChange={() => {}}
    />
  ),
};

export const InviteTeam: Story = {
  render: () => <StepInviteTeam formData={{ invites: [{ email: '' }] }} onChange={() => {}} />,
};

export const Finish: Story = {
  render: () => (
    <StepFinish
      status="idle"
      formData={{ firstName: 'Ada', lastName: 'Lovelace', organizationName: 'Analytical Engines', website: 'https://example.com', invites: [{ email: 'a@example.com' }] }}
    />
  ),
};