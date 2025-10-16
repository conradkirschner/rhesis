'use client';

import { useState } from 'react';
import { Box, Grid, TextField, Button, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import type { UiContactInformationFormProps } from './types';

export default function ContactInformationForm({
  email,
  phone,
  address,
  saving,
  onSave,
}: UiContactInformationFormProps) {
  const [form, setForm] = useState({ email, phone, address });

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSave({
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="contact@example.com"
            helperText="Primary contact email for your organization"
            inputProps={{ 'data-test-id': 'org-email-input' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="tel"
            label="Phone"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+1 (555) 123-4567"
            helperText="Primary contact phone number"
            inputProps={{ 'data-test-id': 'org-phone-input' }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={form.address}
            onChange={handleChange('address')}
            multiline
            rows={3}
            placeholder="123 Main St, City, State, ZIP"
            helperText="Physical address of your organization"
            inputProps={{ 'data-test-id': 'org-address-input' }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={Boolean(saving)}
            data-test-id="org-contact-save"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}