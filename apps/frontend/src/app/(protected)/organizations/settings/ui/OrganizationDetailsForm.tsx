'use client';

import { useState } from 'react';
import { Box, Grid, TextField, Button, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import type { UiOrganizationDetailsFormProps } from './types';

export default function OrganizationDetailsForm({
  name,
  displayName,
  description,
  website,
  logoUrl,
  saving,
  onSave,
}: UiOrganizationDetailsFormProps) {
  const [form, setForm] = useState({
    name,
    displayName,
    description,
    website,
    logoUrl,
  });

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSave({
      name: form.name,
      displayName: form.displayName,
      description: form.description,
      website: form.website,
      logoUrl: form.logoUrl,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Organization Name"
            value={form.name}
            onChange={handleChange('name')}
            helperText="The internal name for your organization"
            inputProps={{ 'data-test-id': 'org-name-input' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Display Name"
            value={form.displayName}
            onChange={handleChange('displayName')}
            helperText="Friendly name shown to users (optional)"
            inputProps={{ 'data-test-id': 'org-display-name-input' }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={form.description}
            onChange={handleChange('description')}
            multiline
            rows={3}
            helperText="A brief description of your organization"
            inputProps={{ 'data-test-id': 'org-description-input' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="url"
            label="Website"
            placeholder="https://example.com"
            value={form.website}
            onChange={handleChange('website')}
            helperText="Your organization's website"
            inputProps={{ 'data-test-id': 'org-website-input' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="url"
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            value={form.logoUrl}
            onChange={handleChange('logoUrl')}
            helperText="URL to your organization's logo"
            inputProps={{ 'data-test-id': 'org-logo-url-input' }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={Boolean(saving)}
            data-test-id="org-details-save"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}