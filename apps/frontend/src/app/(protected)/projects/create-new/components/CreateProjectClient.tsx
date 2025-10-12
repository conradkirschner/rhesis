'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Container,
  Snackbar,
  Alert,
  useTheme,
} from '@mui/material';
import ProjectDetailsStep from './ProjectDetailsStep';
import FinishStep from './FinishStep';

import type { ProjectCreate } from '@/api-client/types.gen';
import { createProjectProjectsPostMutation } from '@/api-client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';

interface FormData {
  projectName: string;
  description: string;
  icon: string;
  owner_id?: string;
}

const steps = ['Project Details', 'Finish'];

interface CreateProjectClientProps {
  sessionToken: string;
  userId: string;
  organizationId?: string;
  userName: string;
  userImage: string;
}

export default function CreateProjectClient({
                                              userId,
                                              organizationId,
                                              userName,
                                              userImage,
                                            }: CreateProjectClientProps) {
  const router = useRouter();
  const theme = useTheme();

  const [activeStep, setActiveStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<FormData>({
    projectName: '',
    description: '',
    icon: 'SmartToy',
    owner_id: userId,
  });

  const createProjectMutation = useMutation(
      createProjectProjectsPostMutation()
  );

  const isSubmitting = createProjectMutation.isPending;

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleComplete = async () => {
    try {
      setError(null);

      if (!userId) {
        setError('Invalid user ID');
        return;
      }
      if (!organizationId) {
        setError(
            'Organization ID is required. Please complete the onboarding process to create an organization first.'
        );
        return;
      }
      if (!formData.projectName.trim()) {
        setError('Project name is required');
        return;
      }

      const projectData: ProjectCreate = {
        name: formData.projectName,
        description: formData.description,
        user_id: userId,
        owner_id: formData.owner_id ?? userId,
        organization_id: organizationId,
        is_active: true,
        icon: formData.icon,
      };

      void await createProjectMutation.mutateAsync({
        body: projectData,
      });

      // Optionally, route to the newly created project using created.id if available
      router.push('/projects');
    } catch (e) {
      const msg =
          e instanceof Error
              ? e.message
              : 'An unknown error occurred while creating the project.';
      if (msg.includes('Failed to fetch')) {
        setError(
            'Network error: Could not reach the API server. Please check your connection or try again later.'
        );
      } else if (msg.toLowerCase().includes('already exists')) {
        setError('A project with this name already exists. Please choose a different name.');
      } else {
        setError(`Error creating project: ${msg}`);
      }
    }
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
            <ProjectDetailsStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                userName={userName}
                userImage={userImage}
                userId={userId}
            />
        );
      case 1:
        return (
            <FinishStep
                formData={formData}
                onComplete={handleComplete}
                onBack={handleBack}
                isSubmitting={isSubmitting}
            />
        );
      default:
        return null;
    }
  };

  const handleCloseError = () => setError(null);

  return (
      <Container
          maxWidth="lg"
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
      >
        <Paper
            elevation={0}
            sx={{
              pt: 2,
              pb: 3,
              px: 3,
              borderRadius: theme.shape.borderRadius,
              width: '100%',
              maxWidth: 800,
              minWidth: 800,
            }}
        >
          <Typography variant="h4" align="center" sx={{ mb: 3 }}>
            Create New Project
          </Typography>

          <Box sx={{ width: '100%', mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
              ))}
            </Stepper>
          </Box>

          {renderStep()}
        </Paper>

        <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleCloseError}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
  );
}
