'use client';

import * as React from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Container,
} from '@mui/material';
import OrganizationDetailsStep from './OrganizationDetailsStep';
import InviteTeamStep from './InviteTeamStep';
import FinishStep from './FinishStep';
import { UUID } from 'crypto';
import { useNotifications } from '@/components/common/NotificationContext';
import { useMutation } from '@tanstack/react-query';

import {
  createOrganizationOrganizationsPostMutation,
  updateUserUsersUserIdPutMutation,
  createUserUsersPostMutation,
  initializeOrganizationDataOrganizationsOrganizationIdLoadInitialDataPostMutation,
} from '@/api-client/@tanstack/react-query.gen';

import type {
  OrganizationCreate,
  UserUpdate,
  UserCreate,
  StatusMessageResponse,
  UserUpdateResponse,
  Organization,
} from '@/api-client/types.gen';

type OnboardingStatus =
    | 'idle'
    | 'creating_organization'
    | 'updating_user'
    | 'loading_initial_data'
    | 'completed';

interface FormData {
  firstName: string;
  lastName: string;
  organizationName: string;
  website: string;
  invites: { email: string }[];
}

interface OnboardingPageClientProps {
  sessionToken: string; // not needed for mutations; kept to match your current prop shape
  userId: UUID;
}

const steps = ['Organization Details', 'Invite Team', 'Finish'];

export default function OnboardingPageClient({ userId }: OnboardingPageClientProps) {
  const notifications = useNotifications();

  const [activeStep, setActiveStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [onboardingStatus, setOnboardingStatus] = React.useState<OnboardingStatus>('idle');
  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    organizationName: '',
    website: '',
    invites: [{ email: '' }],
  });

  const createOrganizationMutation = useMutation(
      createOrganizationOrganizationsPostMutation()
  );

  const updateUserMutation = useMutation(
      updateUserUsersUserIdPutMutation()
  );

  const createUserMutation = useMutation(
      createUserUsersPostMutation()
  );

  const initializeOrgDataMutation = useMutation(
      initializeOrganizationDataOrganizationsOrganizationIdLoadInitialDataPostMutation()
  );

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => s - 1);

  const handleComplete = async () => {
    const userIdStr = String(userId);
    if (!userIdStr) throw new Error('Invalid user ID');
    try {
      setIsSubmitting(true);


      // 1) Create Organization
      setOnboardingStatus('creating_organization');
      const organizationData: OrganizationCreate = {
        name: formData.organizationName,
        website: formData.website || undefined,
        owner_id: userIdStr,
        user_id: userIdStr,
        is_active: true,
        is_domain_verified: false,
      };

      let organization: Organization;
      try {
        organization = await createOrganizationMutation.mutateAsync({
          body: organizationData,
        });
      } catch (orgError) {
        setIsSubmitting(false);
        notifications.show(
            (orgError as Error).message || 'Failed to create organization. Please try again.',
            { severity: 'error' }
        );
        return;
      }

      // 2) Update User (and pick up session token if provided)
      setOnboardingStatus('updating_user');
      const userUpdate: UserUpdate = {
        given_name: formData.firstName,
        family_name: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        organization_id: organization.id,
      };

      let userUpdateResponse: UserUpdateResponse;
      try {
        userUpdateResponse = await updateUserMutation.mutateAsync({
          path: { user_id: userIdStr },
          body: userUpdate,
        });
      } catch (userError) {
        setIsSubmitting(false);
        notifications.show(
            (userError as Error).message || 'Failed to update user. Please try again.',
            { severity: 'error' }
        );
        return;
      }

      // Set next-auth session cookie if server returned a token
      if (userUpdateResponse.session_token && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const cookieOptions = isLocalhost
            ? 'path=/; samesite=lax'
            : 'path=/; secure; samesite=lax';

        document.cookie = `next-auth.session-token=${userUpdateResponse.session_token}; ${cookieOptions}`;
      }

      // 3) Invite Team (optional)
      try {
        const validEmails = formData.invites
            .map((i) => i.email.trim())
            .filter((e) => e.length > 0);

        if (validEmails.length > 0) {
          const results = await Promise.allSettled(
              validEmails.map((email) => {
                const userCreate: UserCreate = {
                  email,
                  organization_id: organization.id,
                  is_active: true,
                  send_invite: true,
                };
                return createUserMutation.mutateAsync({ body: userCreate });
              })
          );

          const successCount = results.filter((r) => r.status === 'fulfilled').length;
          const failed = results
              .map((r, i) => ({ r, email: validEmails[i] }))
              .filter((x) => x.r.status === 'rejected') as Array<{
            r: PromiseRejectedResult;
            email: string;
          }>;

          if (successCount > 0 && failed.length === 0) {
            notifications.show(
                `Successfully invited ${successCount} team member${successCount === 1 ? '' : 's'}!`,
                { severity: 'success' }
            );
          } else if (successCount > 0 && failed.length > 0) {
            notifications.show(
                `Successfully invited ${successCount}. ${failed.length} invitation${failed.length === 1 ? '' : 's'} failed.`,
                { severity: 'warning' }
            );
            failed.forEach(({ r, email }) => {
              notifications.show(
                  `Failed to invite ${email}: ${(r.reason as Error)?.message ?? 'Unknown error'}`,
                  { severity: 'error' }
              );
            });
          } else if (failed.length > 0) {
            notifications.show(
                `Failed to send all ${failed.length} invitation${failed.length === 1 ? '' : 's'}. Please try again.`,
                { severity: 'error' }
            );
          }
        }
      } catch (inviteErr) {
        // Non-blocking
        notifications.show(
            (inviteErr as Error).message ??
            'Unknown error occurred while sending invitations',
            { severity: 'warning' }
        );
      }

      // 4) Initialize Organization Data
      setOnboardingStatus('loading_initial_data');
      try {
        const initRes: StatusMessageResponse =
            await initializeOrgDataMutation.mutateAsync({
              path: { organization_id: String(organization.id) },
            });

        if (initRes.status === 'success') {
          setOnboardingStatus('completed');
          notifications.show('Onboarding completed successfully!', { severity: 'success' });
          // Small delay to show toast
          await new Promise((r) => setTimeout(r, 800));
          window.location.href = '/dashboard';
          return;
        }
        notifications.show(
            'Failed to initialize organization data',
            { severity: 'error' }
        );
      } catch (initError) {
        setIsSubmitting(false);
        setOnboardingStatus('idle');
        notifications.show(
            (initError as Error).message ??
            'Failed to set up organization. Please contact support.',
            { severity: 'error' }
        );
        return;
      }
    } catch (err) {
      setIsSubmitting(false);
      setOnboardingStatus('idle');
      notifications.show(
          (err as Error).message ?? 'Failed to complete onboarding. Please try again.',
          { severity: 'error' }
      );
    }
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
            <OrganizationDetailsStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
            />
        );
      case 1:
        return (
            <InviteTeamStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
            />
        );
      case 2:
        return (
            <FinishStep
                formData={formData}
                onComplete={handleComplete}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                onboardingStatus={onboardingStatus}
            />
        );
      default:
        return null;
    }
  };

  return (
      <Container maxWidth="md">
        <Box py={4}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              Welcome to Rhesis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let&apos;s get your workspace set up in just a few steps
            </Typography>
          </Box>

          <Box mb={4}>
            <Paper variant="outlined" elevation={0}>
              <Box p={3}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                  ))}
                </Stepper>
              </Box>
            </Paper>
          </Box>

          <Box>{renderStep()}</Box>
        </Box>
      </Container>
  );
}
