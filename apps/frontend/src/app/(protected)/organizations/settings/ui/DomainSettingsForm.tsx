'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Save as SaveIcon, CheckCircle, Cancel } from '@mui/icons-material';
import type { UiDomainSettingsFormProps } from './types';

export default function DomainSettingsForm({
  domain,
  isVerified,
  saving,
  onSave,
}: UiDomainSettingsFormProps) {
  const [value, setValue] = useState(domain);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSave({ domain: value });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Domain verification status:
          </Typography>
          {isVerified ? (
            <Chip icon={<CheckCircle />} label="Verified" color="success" size="small" />
          ) : (
            <Chip icon={<Cancel />} label="Not Verified" size="small" />
          )}
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Domain"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="example.com"
            helperText="Your organization's domain for automatic user association"
            inputProps={{ 'data-test-id': 'org-domain-input' }}
          />
        </Grid>
        {!isVerified && value && (
          <Grid item xs={12}>
            <Alert severity="info">
              After saving your domain, you&apos;ll need to verify ownership to enable automatic
              user association. Contact support for verification instructions.
            </Alert>
          </Grid>
        )}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={Boolean(saving)}
            data-test-id="org-domain-save"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}