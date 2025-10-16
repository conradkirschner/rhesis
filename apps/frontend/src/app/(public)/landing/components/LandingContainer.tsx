'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { getClientApiBaseUrl } from '@/utils/url-resolver';
import {
  useAuthValidationData,
} from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import { InlineLoader } from '../ui/InlineLoader';
import { ErrorBanner } from '../ui/ErrorBanner';
import LoginSection from '../ui/LoginSection';
import type {
  UiLoginSectionProps,
} from '../ui/types';

export default function LandingContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsWarning, setShowTermsWarning] = useState(false);
  const [previouslyAccepted, setPreviouslyAccepted] = useState(false);
  const [forcedLogoutFlow, setForcedLogoutFlow] = useState(false);

  const sessionExpiredParam = searchParams.get('session_expired') === 'true';
  const forceLogoutParam = searchParams.get('force_logout') === 'true';

  useEffect(() => {
    const hasAccepted = typeof window !== 'undefined' && localStorage.getItem('termsAccepted') === 'true';
    if (hasAccepted) {
      setTermsAccepted(true);
      setPreviouslyAccepted(true);
    }
  }, []);

  useEffect(() => {
    if (forceLogoutParam || sessionExpiredParam) {
      setForcedLogoutFlow(true);
    }
  }, [forceLogoutParam, sessionExpiredParam]);

  const sessionToken = (session as unknown as { session_token?: string } | null)?.session_token ?? null;

  const { backendSessionValid, isVerifying, verifyError, logoutBackend } =
    useAuthValidationData({
      sessionToken,
      enabled: status === 'authenticated' && !forcedLogoutFlow,
    });

  useEffect(() => {
    if (forcedLogoutFlow && status === 'authenticated') {
      (async () => {
        await logoutBackend().catch(() => undefined);
        await signOut({ redirect: true, callbackUrl: '/' });
      })();
    }
  }, [forcedLogoutFlow, status, logoutBackend]);

  useEffect(() => {
    if (status === 'authenticated' && backendSessionValid === true) {
      router.replace('/dashboard');
    }
    if (status === 'authenticated' && backendSessionValid === false && !isVerifying) {
      (async () => {
        await logoutBackend().catch(() => undefined);
        await signOut({ redirect: true, callbackUrl: '/' });
      })();
    }
  }, [status, backendSessionValid, isVerifying, logoutBackend, router]);

  const onToggleTerms: UiLoginSectionProps['onToggleTerms'] = accepted => {
    setTermsAccepted(accepted);
    setShowTermsWarning(false);
    if (accepted) {
      try {
        localStorage.setItem('termsAccepted', 'true');
      } catch {
        // noop
      }
    }
  };

  const onLogin: UiLoginSectionProps['onLogin'] = provider => {
    if (!termsAccepted) {
      setShowTermsWarning(true);
      return;
    }
    setShowTermsWarning(false);

    const redirectUri = `${getClientApiBaseUrl()}/auth/login`;
    const url = new URL(redirectUri);
    if (provider !== 'email') {
      url.searchParams.set('connection', provider);
    }
    const returnTo = searchParams.get('return_to') || '/dashboard';
    url.searchParams.set('return_to', returnTo);
    window.location.href = url.toString();
  };

  const loginProps = useMemo(
    () =>
      ({
        termsAccepted,
        previouslyAccepted,
        showTermsWarning,
        onToggleTerms,
        onLogin,
      } satisfies UiLoginSectionProps),
    [termsAccepted, previouslyAccepted, showTermsWarning]
  );

  if (status === 'loading') {
    return (
      <FeaturePageFrame right={<InlineLoader label="Loading session..." />} />
    );
  }

  if (status === 'authenticated') {
    if (verifyError) {
      return (
        <FeaturePageFrame
          right={
            <ErrorBanner message="We couldn't validate your session with the backend. Please try signing in again." />
          }
        />
      );
    }
    return (
      <FeaturePageFrame
        userName={session?.user?.name ?? 'User'}
        right={<InlineLoader label="Redirecting you to the dashboard..." />}
      />
    );
  }

  return <FeaturePageFrame right={<LoginSection {...loginProps} />} />;
}