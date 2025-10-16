'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProjectData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepProjectDetails from '../ui/steps/StepProjectDetails';
import StepFinishReview from '../ui/steps/StepFinishReview';
import type {
  UiActionBarProps,
  UiFeaturePageFrameProps,
  UiStepperHeaderProps,
  UiProjectDetailsStepProps,
  UiFinishStepProps,
} from '../ui/types';

type Props = Readonly<{
  userId: string;
  organizationId: string;
  userName: string;
  userImage: string;
}>;

const STEPS = ['Project Details', 'Finish'] as const;

export default function CreateProjectContainer(props: Props) {
  const router = useRouter();

  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<{
    readonly projectName: string;
    readonly description: string;
    readonly icon: string;
    readonly ownerId: string;
  }>({
    projectName: '',
    description: '',
    icon: 'SmartToy',
    ownerId: props.userId,
  });

  const { owner, isOwnerLoading, createProject, isCreating } = useCreateProjectData({
    ownerId: form.ownerId,
  });

  const next = () => setActiveStep((s) => s + 1);
  const back = () => setActiveStep((s) => s - 1);

  const updateForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onComplete = async () => {
    setError(null);

    if (!props.userId) {
      setError('Invalid user ID');
      return;
    }
    if (!props.organizationId) {
      setError('Organization ID is required. Please complete onboarding first.');
      return;
    }
    if (!form.projectName.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      await createProject({
        name: form.projectName,
        description: form.description,
        icon: form.icon,
        ownerId: form.ownerId,
        userId: props.userId,
        organizationId: props.organizationId,
      });
      router.push('/projects');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'An unknown error occurred while creating the project.';
      if (msg.includes('Failed to fetch')) {
        setError('Network error: Could not reach the API server. Check your connection and retry.');
      } else if (msg.toLowerCase().includes('already exists')) {
        setError('A project with this name already exists. Choose a different name.');
      } else {
        setError(`Error creating project: ${msg}`);
      }
    }
  };

  const frameProps = {
    title: 'Create New Project',
  } satisfies UiFeaturePageFrameProps;

  const headerProps = {
    steps: STEPS as readonly string[],
    activeStep,
  } satisfies UiStepperHeaderProps;

  const actionBarProps = {
    onCancel: () => router.push('/projects'),
    onBack: activeStep > 0 ? back : undefined,
    onNext: activeStep === 0 ? next : undefined,
    onSubmit: activeStep === 1 ? onComplete : undefined,
    isBusy: isCreating,
    nextLabel: 'Continue',
    submitLabel: isCreating ? 'Creating Project...' : 'Create Project',
  } satisfies UiActionBarProps;

  const detailsProps = {
    owners: [
      {
        id: props.userId,
        name: props.userName,
        email: undefined,
        picture: props.userImage,
      },
    ] as const,
    form: {
      projectName: form.projectName,
      description: form.description,
      icon: form.icon,
      ownerId: form.ownerId,
    },
    onFormChange: (patch) => updateForm(patch),
  } satisfies UiProjectDetailsStepProps;

  const finishProps = {
    form: {
      projectName: form.projectName,
      description: form.description,
      icon: form.icon,
    },
    owner: owner
      ? {
          name: owner.name ?? owner.email ?? owner.id,
          picture: owner.picture ?? undefined,
        }
      : undefined,
    isOwnerLoading,
  } satisfies UiFinishStepProps;

  return (
    <FeaturePageFrame {...frameProps}>
      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <StepperHeader {...headerProps} />

      {activeStep === 0 ? (
        <StepProjectDetails {...detailsProps} />
      ) : isOwnerLoading && !owner ? (
        <InlineLoader label="Loading owner details..." />
      ) : (
        <StepFinishReview {...finishProps} />
      )}

      <ActionBar {...actionBarProps} />
    </FeaturePageFrame>
  );
}