'use client';

import * as React from 'react';
import { useOnboardingData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import { useSession } from 'next-auth/react';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import { StepOrganizationDetails } from '../ui/steps/StepOrganizationDetails';
import { StepInviteTeam } from '../ui/steps/StepInviteTeam';
import { StepFinish } from '../ui/steps/StepFinish';
import type {
  UiOnboardingForm,
  UiOnboardingStatus,
  UiFeaturePageFrameProps,
  UiActionBarProps,
} from '../ui/types';

type Props = {
  readonly userId: string;
};

const STEPS = ['Organization Details', 'Invite Team', 'Finish'] as const;

export default function OnboardingContainer({ userId }: Props) {
  const { data: session } = useSession();
  const notifications = useNotifications();
  const { completeOnboarding, isPending } = useOnboardingData();

  const [activeStep, setActiveStep] = React.useState(0);
  const [status, setStatus] = React.useState<UiOnboardingStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<UiOnboardingForm>({
    firstName: '',
    lastName: '',
    organizationName: '',
    website: '',
    invites: [{ email: '' }],
  });

  React.useEffect(() => {
    const looksLikeEmail = (str: string) => str.includes('@') && str.includes('.');
    const given = (session?.user as { given_name?: string } | undefined)?.given_name ?? '';
    const family = (session?.user as { family_name?: string } | undefined)?.family_name ?? '';
    const name = session?.user?.name ?? '';
    const parts = !looksLikeEmail(name) ? name.split(' ') : [];

    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || given || parts[0] || '',
      lastName: prev.lastName || family || (parts.length > 1 ? parts.slice(1).join(' ') : ''),
    }));
  }, [session]);

  const setFormPatch = (patch: Partial<UiOnboardingForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleComplete = async () => {
    setError(null);
    try {
      setStatus('creating_organization');
      const invites = form.invites.map((i) => i.email);

      const res = await completeOnboarding({
        userId: String(userId),
        firstName: form.firstName,
        lastName: form.lastName,
        organizationName: form.organizationName,
        website: form.website || undefined,
        invites,
      });

      if (res.sessionToken && typeof document !== 'undefined') {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const cookieOptions = isLocalhost ? 'path=/; samesite=lax' : 'path=/; secure; samesite=lax';
        document.cookie = `next-auth.session-token=${res.sessionToken}; ${cookieOptions}`;
      }

      setStatus('completed');
      notifications.show('Onboarding completed successfully!', { severity: 'success' });
      window.location.href = '/dashboard';
    } catch (e) {
      setStatus('idle');
      const message = (e as Error).message || 'Failed to complete onboarding.';
      setError(message);
      notifications.show(message, { severity: 'error' });
    }
  };

  const frameProps: UiFeaturePageFrameProps = {
    title: 'Welcome to Rhesis',
    subtitle: "Let's get your workspace set up in a few steps",
    steps: [...STEPS],
    activeStep,
    children: null,
  };

  const actionBarCommon: Pick<UiActionBarProps, 'onBack' | 'onNext' | 'onComplete' | 'isBusy'> = {
    onBack: handleBack,
    onNext: handleNext,
    onComplete: handleComplete,
    isBusy: isPending || status !== 'idle',
  };

  const StepComponents = {
    0: (
      <StepOrganizationDetails
        formData={form}
        onChange={setFormPatch}
      />
    ),
    1: (
      <StepInviteTeam
        formData={form}
        onChange={setFormPatch}
      />
    ),
    2: (
      <StepFinish
        formData={form}
        status={status}
      />
    ),
  } as const;

  const actionBars = {
    0: <ActionBar {...actionBarCommon} showBack={false} primaryLabel="Next" />,
    1: <ActionBar {...actionBarCommon} showBack primaryLabel="Next" />,
    2: (
      <ActionBar
        {...actionBarCommon}
        showBack
        primaryLabel={
          status === 'creating_organization'
            ? 'Setting up...'
            : status === 'completed'
            ? 'Setup completed'
            : 'Complete Setup'
        }
        primaryAction="complete"
      />
    ),
  } as const;

  return (
    <FeaturePageFrame {...(frameProps satisfies UiFeaturePageFrameProps)}>
      <StepperHeader title={STEPS[activeStep]} description="" />
      {error ? <ErrorBanner message={error} /> : null}
      {isPending && activeStep !== 2 ? <InlineLoader minHeight={200} /> : StepComponents[activeStep as 0 | 1 | 2]}
      {actionBars[activeStep as 0 | 1 | 2]}
    </FeaturePageFrame>
  );
}