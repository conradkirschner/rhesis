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
import { useNotifications } from '@/components/common/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Organization } from '@/api-client/types.gen';

import {readOrganizationOrganizationsOrganizationIdGetQueryKey, updateOrganizationOrganizationsOrganizationIdPutMutation } from '@/api-client/@tanstack/react-query.gen';

interface OrganizationDetailsFormProps {
  organization: Organization;
  sessionToken: string;
  onUpdate: () => void;
}

export default function OrganizationDetailsForm({
                                                  organization,
                                                  onUpdate,
                                                }: OrganizationDetailsFormProps) {
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: organization.name ?? '',
    display_name: organization.display_name ?? '',
    description: organization.description ?? '',
    website: organization.website ?? '',
    logo_url: organization.logo_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated mutation
  const updateOrgMutation = useMutation({
      ...updateOrganizationOrganizationsOrganizationIdPutMutation(),
      onSuccess: async () => {
        if (organization.id) {
          const queryKey = readOrganizationOrganizationsOrganizationIdGetQueryKey({
            path: { organization_id: organization.id },
          });
          await queryClient.invalidateQueries({ queryKey });
        }
        notifications.show('Organization details updated successfully1232', {
          severity: 'success',
        });
        onUpdate();
      },
          onError: (e) => {
        const message = e instanceof Error ? e.message : 'Failed to update organization details';
        setError(message);
        notifications.show(message, { severity: 'error' });
      },
    });

  const handleChange =
      (field: keyof typeof formData) =>
          (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData({ ...formData, [field]: e.target.value });
            setError(null);
          };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.id) {
      throw new Error('Organization ID required');
    }
    setSaving(true);
    setError(null);

    try {
      await updateOrgMutation.mutateAsync({
        path: { organization_id: organization.id },
        body: {
          name: formData.name, // keep required
          display_name: formData.display_name || undefined,
          description: formData.description || undefined,
          website: formData.website || undefined,
          logo_url: formData.logo_url || undefined,
        },
      });
      notifications.show('Organization details updated successfully', {
        severity: 'success',
      });
      onUpdate();
    } catch (err) {
      console.error('Error updating organization:', err);
      setError((err as unknown as Error)?.message || 'Failed to update organization details');
    } finally {
      setSaving(false);
    }
  };

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
                label="Organization Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                helperText="The internal name for your organization"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Display Name"
                value={formData.display_name}
                onChange={handleChange('display_name')}
                helperText="Friendly name shown to users (optional)"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={3}
                helperText="A brief description of your organization"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleChange('website')}
                type="url"
                placeholder="https://example.com"
                helperText="Your organization's website"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Logo URL"
                value={formData.logo_url}
                onChange={handleChange('logo_url')}
                type="url"
                placeholder="https://example.com/logo.png"
                helperText="URL to your organization's logo"
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
