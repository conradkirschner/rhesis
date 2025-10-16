'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useOrganizationSettingsData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import OrganizationDetailsForm from '../ui/OrganizationDetailsForm';
import ContactInformationForm from '../ui/ContactInformationForm';
import DomainSettingsForm from '../ui/DomainSettingsForm';
import SubscriptionInfo from '../ui/SubscriptionInfo';
import DangerZone from '../ui/DangerZone';
import type {
  UiOrganizationDetailsFormProps,
  UiContactInformationFormProps,
  UiDomainSettingsFormProps,
  UiSubscriptionInfoProps,
  UiDangerZoneProps,
} from '../ui/types';

type Props = {
  organizationId: string;
};

export default function OrganizationSettingsContainer({ organizationId }: Props) {
  const router = useRouter();
  const notifications = useNotifications();
  const { data: session } = useSession();

  const resolvedOrgId =
    organizationId === 'me'
      ? session?.user?.organization_id ?? ''
      : organizationId;

  const {
    organization,
    isLoading,
    isError,
    errorMessage,
    refetch,
    updateOrganization,
    isUpdating,
    leaveOrganization,
    isLeaving,
  } = useOrganizationSettingsData(resolvedOrgId);

  const detailsProps = useMemo(
    () =>
      organization
        ? {
            name: organization.name,
            displayName: organization.display_name ?? '',
            description: organization.description ?? '',
            website: organization.website ?? '',
            logoUrl: organization.logo_url ?? '',
            onSave: async (payload) => {
              await updateOrganization({
                name: payload.name,
                display_name: payload.displayName || undefined,
                description: payload.description || undefined,
                website: payload.website || undefined,
                logo_url: payload.logoUrl || undefined,
              });
              notifications.show('Organization details updated', {
                severity: 'success',
              });
              void refetch();
            },
            saving: isUpdating,
          } satisfies UiOrganizationDetailsFormProps
        : null,
    [organization, updateOrganization, isUpdating, notifications, refetch],
  );

  const contactProps = useMemo(
    () =>
      organization
        ? {
            email: organization.email ?? '',
            phone: organization.phone ?? '',
            address: organization.address ?? '',
            onSave: async (payload) => {
              await updateOrganization({
                email: payload.email || undefined,
                phone: payload.phone || undefined,
                address: payload.address || undefined,
              });
              notifications.show('Contact information updated', {
                severity: 'success',
              });
              void refetch();
            },
            saving: isUpdating,
          } satisfies UiContactInformationFormProps
        : null,
    [organization, updateOrganization, isUpdating, notifications, refetch],
  );

  const domainProps = useMemo(
    () =>
      organization
        ? {
            domain: organization.domain ?? '',
            isVerified: Boolean(organization.is_domain_verified),
            onSave: async (payload) => {
              await updateOrganization({
                domain: payload.domain || undefined,
              });
              notifications.show('Domain settings updated', {
                severity: 'success',
              });
              void refetch();
            },
            saving: isUpdating,
          } satisfies UiDomainSettingsFormProps
        : null,
    [organization, updateOrganization, isUpdating, notifications, refetch],
  );

  const subscriptionProps = useMemo(
    () =>
      organization
        ? {
            isActive: Boolean(organization.is_active),
            maxUsers: organization.max_users ?? null,
            subscriptionEndsAt: organization.subscription_ends_at ?? null,
            createdAt: organization.created_at ?? null,
          } satisfies UiSubscriptionInfoProps
        : null,
    [organization],
  );

  const dangerZoneProps = useMemo(
    () =>
      organization
        ? {
            organizationName: organization.name,
            onLeaveConfirmed: async () => {
              await leaveOrganization();
              notifications.show(`You have left ${organization.name}`, {
                severity: 'success',
              });
              router.push(
                `/auth/signin?message=${encodeURIComponent(
                  `You have successfully left ${organization.name}. You can now create a new organization or accept an invitation.`,
                )}`,
              );
              await signOut({ redirect: false });
            },
            leaving: isLeaving,
          } satisfies UiDangerZoneProps
        : null,
    [organization, leaveOrganization, isLeaving, notifications, router],
  );

  if (!resolvedOrgId) {
    return (
      <FeaturePageFrame title="Organization Settings">
        <ErrorBanner message="No organization in session. Please contact support." />
      </FeaturePageFrame>
    );
  }

  if (isLoading) {
    return (
      <FeaturePageFrame title="Organization Settings">
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  if (isError) {
    return (
      <FeaturePageFrame title="Organization Settings">
        <ErrorBanner message={errorMessage || 'Failed to load organization details'} />
      </FeaturePageFrame>
    );
  }

  if (!organization) {
    return (
      <FeaturePageFrame title="Organization Settings">
        <ErrorBanner severity="warning" message="No organization found. Please contact support." />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame title="Organization Settings">
      {detailsProps && <OrganizationDetailsForm {...detailsProps} />}
      {contactProps && <ContactInformationForm {...contactProps} />}
      {domainProps && <DomainSettingsForm {...domainProps} />}
      {subscriptionProps && <SubscriptionInfo {...subscriptionProps} />}
      {dangerZoneProps && <DangerZone {...dangerZoneProps} />}
    </FeaturePageFrame>
  );
}