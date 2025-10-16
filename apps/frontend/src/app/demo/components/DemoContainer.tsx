'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDemoData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import StepLoading from '../ui/steps/StepLoading';
import StepCredentials from '../ui/steps/StepCredentials';
import StepRedirecting from '../ui/steps/StepRedirecting';
import type {
  UiDemoFrameProps,
  UiStepperHeaderProps,
  UiStepCredentialsProps,
} from '../ui/types';

export default function DemoContainer() {
  const { demoAuthUrl } = useDemoData();

  const [showCredentials, setShowCredentials] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCredentials(true), 800);
    const t2 = setTimeout(() => setShowBackground(true), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleContinue = useCallback(() => {
    // Console logging is acceptable side-effect in container.
    // eslint-disable-next-line no-console
    console.log('🟢 [DEBUG] Demo page - redirecting with demo user pre-filled');
    setIsRedirecting(true);
    window.location.href = demoAuthUrl;
  }, [demoAuthUrl]);

  const frameProps = useMemo(
    () =>
      ({
        showBackground,
        children: (
          <>
            <StepperHeader
              logoSrc="/logos/rhesis-logo-platypus.png"
              logoAlt="Rhesis AI Platypus Logo"
            />
            {isRedirecting ? (
              <StepRedirecting />
            ) : showCredentials ? (
              <StepCredentials
                email="demo@rhesis.ai"
                password="PlatypusDemo!"
                onContinue={handleContinue}
              />
            ) : (
              <StepLoading />
            )}
          </>
        ),
      } satisfies UiDemoFrameProps),
    [handleContinue, isRedirecting, showBackground, showCredentials],
  );

  // Header props validated for shape.
  const _headerProps = {
    logoSrc: '/logos/rhesis-logo-platypus.png',
    logoAlt: 'Rhesis AI Platypus Logo',
  } satisfies UiStepperHeaderProps;

  const _credentialsProps = {
    email: 'demo@rhesis.ai',
    password: 'PlatypusDemo!',
    onContinue: handleContinue,
  } satisfies UiStepCredentialsProps;

  return <FeaturePageFrame {...frameProps} />;
}