import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../../ui/FeaturePageFrame';
import OrganizationDetailsForm from '../../ui/OrganizationDetailsForm';
import ContactInformationForm from '../../ui/ContactInformationForm';
import DomainSettingsForm from '../../ui/DomainSettingsForm';
import SubscriptionInfo from '../../ui/SubscriptionInfo';
import DangerZone from '../../ui/DangerZone';

const meta = {
  title: 'Organization Settings/Overview',
} satisfies Meta;
export default meta;

export const Overview: StoryObj = {
  render: () => (
    <FeaturePageFrame title="Organization Settings">
      <OrganizationDetailsForm
        name="Acme Inc."
        displayName="Acme"
        description="We make anvils."
        website="https://acme.example"
        logoUrl="https://acme.example/logo.png"
        onSave={async () => {}}
      />
      <ContactInformationForm
        email="contact@acme.example"
        phone="+1 555 123 4567"
        address="123 Main St, Springfield"
        onSave={async () => {}}
      />
      <DomainSettingsForm domain="acme.example" isVerified={false} onSave={async () => {}} />
      <SubscriptionInfo
        isActive
        maxUsers={100}
        subscriptionEndsAt={new Date(Date.now() + 86_400_000 * 45).toISOString()}
        createdAt={new Date().toISOString()}
      />
      <DangerZone organizationName="Acme Inc." onLeaveConfirmed={async () => {}} />
    </FeaturePageFrame>
  ),
};