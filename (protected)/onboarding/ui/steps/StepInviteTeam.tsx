import * as React from 'react';
import { Box, Paper, Stack, TextField, IconButton, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StepperHeader from '../..//StepperHeader';
import type { UiStepInviteTeamProps } from '../../types';

export function StepInviteTeam({ formData, onChange }: UiStepInviteTeamProps) {
  const [errors, setErrors] = React.useState<Record<number, { hasError: boolean; message: string }>>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_TEAM_MEMBERS = 10;

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...formData.invites];
    updated[index] = { email: value };
    onChange({ invites: updated });
    if (errors[index]) {
      const next = { ...errors };
      delete next[index];
      setErrors(next);
    }
  };

  const addEmailField = () => {
    if (formData.invites.length >= MAX_TEAM_MEMBERS) return;
    onChange({ invites: [...formData.invites, { email: '' }] });
  };

  const removeEmailField = (index: number) => {
    const updated = [...formData.invites];
    updated.splice(index, 1);
    onChange({ invites: updated });
    if (errors[index]) {
      const next = { ...errors };
      delete next[index];
      setErrors(next);
    }
  };

  const validateList = () => {
    const nonEmpty = formData.invites.filter((i) => i.email.trim());
    if (nonEmpty.length > MAX_TEAM_MEMBERS) return false;

    const emails = formData.invites
      .map((i, idx) => ({ email: i.email.trim().toLowerCase(), idx }))
      .filter((x) => x.email);

    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const { email } of emails) {
      if (seen.has(email)) dupes.add(email);
      else seen.add(email);
    }

    const next: Record<number, { hasError: boolean; message: string }> = {};
    formData.invites.forEach((i, idx) => {
      const v = i.email.trim();
      if (!v) return;
      if (!emailRegex.test(v)) {
        next[idx] = { hasError: true, message: 'Please enter a valid email address' };
      } else if (dupes.has(v.toLowerCase())) {
        next[idx] = { hasError: true, message: 'This email address is already added' };
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  React.useEffect(() => {
    validateList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.invites]);

  return (
    <Box>
      <StepperHeader
        title="Invite Team Members"
        description="Invite colleagues to join your organization. You can skip this step and add team members later."
        subtitle={`You can invite up to ${MAX_TEAM_MEMBERS} team members during onboarding.`}
      />
      <Paper variant="outlined" elevation={0}>
        <Box p={3}>
          <Stack spacing={3}>
            {formData.invites.map((invite, index) => (
              <Box key={index} display="flex" alignItems="flex-start" gap={2}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={invite.email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  error={Boolean(errors[index]?.hasError)}
                  helperText={errors[index]?.message || ''}
                  placeholder="colleague@company.com"
                  variant="outlined"
                  inputProps={{ 'data-test-id': `invite-${index}` }}
                />
                {formData.invites.length > 1 ? (
                  <IconButton
                    onClick={() => removeEmailField(index)}
                    color="error"
                    size="large"
                    data-test-id={`invite-remove-${index}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : null}
              </Box>
            ))}
            <Box display="flex" justifyContent="flex-start">
              <Button
                startIcon={<AddIcon />}
                onClick={addEmailField}
                variant="outlined"
                size="medium"
                disabled={formData.invites.length >= MAX_TEAM_MEMBERS}
                data-test-id="invite-add"
              >
                {formData.invites.length >= MAX_TEAM_MEMBERS ? `Maximum ${MAX_TEAM_MEMBERS} invites reached` : 'Add Another Email'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}