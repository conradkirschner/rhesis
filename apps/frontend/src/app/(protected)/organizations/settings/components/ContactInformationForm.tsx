'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

/** Generated types */
import type { Organization } from '@/api-client/types.gen';

/** Generated TanStack Query */
import { useMutation } from '@tanstack/react-query';
import { updateOrganizationOrganizationsOrganizationIdPutMutation } from '@/api-client/@tanstack/react-query.gen';

import { useNotifications } from '@/components/common/NotificationContext';

interface ContactInformationFormProps {
  organization: Organization;
  onUpdate: () => void;
}

export default function ContactInformationForm({
                                                 organization,
                                                 onUpdate,
                                               }: ContactInformationFormProps) {
  const notifications = useNotifications();

  const [formData, setFormData] = useState({
    email: organization.email ?? '',
    phone: organization.phone ?? '',
    address: organization.address ?? '',
  });
  const [error, setError] = useState<string | null>(null);


  // Generated mutation
  const updateOrgMutation = useMutation(
      updateOrganizationOrganizationsOrganizationIdPutMutation()
  );

  const handleChange =
      (field: keyof typeof formData) =>
          (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, [field]: e.target.value }));
            setError(null);
          };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!organization.id) {
      throw new Error("Organization not found");
    }
    try {
      await updateOrgMutation.mutateAsync({
        path: { organization_id: organization.id },
        body: {
          // Send nulls for empty strings, to match common OpenAPI update shapes
          email: formData.email.trim() === '' ? null : formData.email.trim(),
          phone: formData.phone.trim() === '' ? null : formData.phone.trim(),
          address:
              formData.address.trim() === '' ? null : formData.address.trim(),
        },
      });

      notifications.show('Contact information updated successfully', {
        severity: 'success',
      });
      onUpdate();
    } catch (err) {
      console.error('Error updating contact information:', err);
    }
  };

  const saving = updateOrgMutation.isPending;

  return (
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={handleChange('email')}
                type="email"
                placeholder="contact@example.com"
                helperText="Primary contact email for your organization"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                type="tel"
                placeholder="+1 (555) 123-4567"
                helperText="Primary contact phone number"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={handleChange('address')}
                multiline
                rows={3}
                placeholder="123 Main St, City, State, ZIP"
                helperText="Physical address of your organization"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Grid>
        </Grid>
      </Box>
  );
}
