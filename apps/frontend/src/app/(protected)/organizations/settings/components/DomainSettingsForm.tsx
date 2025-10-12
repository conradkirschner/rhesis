'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Typography,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/components/common/NotificationContext';

/** Generated types */
import type { Organization } from '@/api-client/types.gen';

/** Generated TanStack Query mutation */
import { useMutation } from '@tanstack/react-query';
import { updateOrganizationOrganizationsOrganizationIdPutMutation } from '@/api-client/@tanstack/react-query.gen';

interface DomainSettingsFormProps {
  organization: Organization;
  sessionToken: string;
  onUpdate: () => void;
}

export default function DomainSettingsForm({
                                             organization,
                                             onUpdate,
                                           }: DomainSettingsFormProps) {
  const notifications = useNotifications();
  const [formData, setFormData] = useState({
    domain: organization.domain ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated mutation
  const updateOrgMutation = useMutation(
      updateOrganizationOrganizationsOrganizationIdPutMutation()
  );

  const handleChange =
      (field: keyof typeof formData) =>
          (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData({ ...formData, [field]: e.target.value });
            setError(null);
          };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.id) {
      throw new Error("Invalid organization Id");
    }
    setSaving(true);
    setError(null);

    try {
      await updateOrgMutation.mutateAsync({
        path: { organization_id: organization.id },
        body: {
          // send undefined when empty so backend can ignore
          domain: formData.domain || undefined,
        },
      });

      notifications.show('Domain settings updated successfully', {
        severity: 'success',
      });
      onUpdate();
    } catch (err) {
      console.error('Error updating domain settings:', err);
      setError((err as unknown as Error)?.message || 'Failed to update domain settings');
    } finally {
      setSaving(false);
    }
  };

  const isVerified = !!organization.is_domain_verified;

  return (
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Domain verification status:
              </Typography>
              {isVerified ? (
                  <Chip
                      icon={<CheckCircleIcon />}
                      label="Verified"
                      color="success"
                      size="small"
                  />
              ) : (
                  <Chip
                      icon={<CancelIcon />}
                      label="Not Verified"
                      color="default"
                      size="small"
                  />
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
                fullWidth
                label="Domain"
                value={formData.domain}
                onChange={handleChange('domain')}
                placeholder="example.com"
                helperText="Your organization's domain for automatic user association"
            />
          </Grid>

          {!isVerified && formData.domain && (
              <Grid item xs={12}>
                <Alert severity="info">
                  After saving your domain, you&apos;ll need to verify ownership to
                  enable automatic user association. Contact support for
                  verification instructions.
                </Alert>
              </Grid>
          )}

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
