export type UiOrganizationDetailsFormProps = {
  name: string;
  displayName: string;
  description: string;
  website: string;
  logoUrl: string;
  saving?: boolean;
  onSave: (payload: {
    name: string;
    displayName: string;
    description: string;
    website: string;
    logoUrl: string;
  }) => Promise<void> | void;
};

export type UiContactInformationFormProps = {
  email: string;
  phone: string;
  address: string;
  saving?: boolean;
  onSave: (payload: { email: string; phone: string; address: string }) => Promise<void> | void;
};

export type UiDomainSettingsFormProps = {
  domain: string;
  isVerified: boolean;
  saving?: boolean;
  onSave: (payload: { domain: string }) => Promise<void> | void;
};

export type UiSubscriptionInfoProps = {
  isActive: boolean;
  maxUsers: number | null;
  subscriptionEndsAt: string | null;
  createdAt: string | null;
};

export type UiDangerZoneProps = {
  organizationName: string;
  leaving?: boolean;
  onLeaveConfirmed: () => Promise<void> | void;
};