import * as React from 'react';
import { Box, Paper, Stack, TextField } from '@mui/material';
import StepperHeader from '../StepperHeader';
import { validateName, validateOrganizationName, validateUrl, normalizeUrl } from '@/lib/onboarding/validation';
import type { UiOnboardingForm, UiStepOrganizationDetailsProps } from '../types';

// Only these fields have inline error messages in this step
type ErrorKeys = 'firstName' | 'lastName' | 'organizationName' | 'website';
const isErrorKey = (k: keyof UiOnboardingForm): k is ErrorKeys =>
    k === 'firstName' || k === 'lastName' || k === 'organizationName' || k === 'website';

export function StepOrganizationDetails({ formData, onChange }: UiStepOrganizationDetailsProps) {
  const [errors, setErrors] = React.useState<Record<ErrorKeys, string>>({
    firstName: '',
    lastName: '',
    organizationName: '',
    website: '',
  });

  const validateForm = (data: UiOnboardingForm) => {
    const firstNameValidation = validateName(data.firstName, 'First name');
    const lastNameValidation = validateName(data.lastName, 'Last name');
    const organizationNameValidation = validateOrganizationName(data.organizationName);
    const websiteValidation = validateUrl(data.website, { required: false });

    const newErrors: Record<ErrorKeys, string> = {
      firstName: firstNameValidation.message || '',
      lastName: lastNameValidation.message || '',
      organizationName: organizationNameValidation.message || '',
      website: websiteValidation.message || '',
    };

    setErrors(newErrors);
    return (
        firstNameValidation.isValid &&
        lastNameValidation.isValid &&
        organizationNameValidation.isValid &&
        websiteValidation.isValid
    );
  };

  React.useEffect(() => {
    validateForm(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof UiOnboardingForm; value: string };
    onChange({ [name]: value } as Partial<UiOnboardingForm>);
    // ✅ Only clear errors for fields this step actually validates
    if (isErrorKey(name) && errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof UiOnboardingForm; value: string };
    if (name === 'website' && value.trim()) {
      const normalized = normalizeUrl(value);
      if (normalized !== value) {
        onChange({ website: normalized });
      }
    }
  };

  return (
      <Box>
        <StepperHeader
            title="Help us get to know you and your organization"
            description="We need these details to set up your workspace and personalize your experience."
        />
        <Paper variant="outlined" elevation={0}>
          <Box p={3}>
            <Stack spacing={3}>
              <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName || ''}
                  variant="outlined"
                  inputProps={{ 'data-test-id': 'first-name' }}
              />
              <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName || ''}
                  variant="outlined"
                  inputProps={{ 'data-test-id': 'last-name' }}
              />
              <TextField
                  fullWidth
                  label="Organization Name"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  required
                  error={Boolean(errors.organizationName)}
                  helperText={errors.organizationName || ''}
                  variant="outlined"
                  inputProps={{ 'data-test-id': 'organization-name' }}
              />
              <TextField
                  fullWidth
                  label="Website URL (Optional)"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://example.com"
                  error={Boolean(errors.website)}
                  helperText={errors.website || "Enter your organization's website URL"}
                  variant="outlined"
                  inputProps={{ 'data-test-id': 'website' }}
              />
            </Stack>
          </Box>
        </Paper>
      </Box>
  );
}
