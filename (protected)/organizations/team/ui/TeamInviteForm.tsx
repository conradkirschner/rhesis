'use client';

import { Box, TextField, Button, Stack, IconButton, Typography, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import StepperHeader from './StepperHeader';
import type { UiTeamInviteFormProps } from './types';

export default function TeamInviteForm(props: UiTeamInviteFormProps) {
  const { invites, onChangeEmail, onAdd, onRemove, onSubmit, isSubmitting, maxInvites } = props;

  return (
    <Box component="section" data-test-id="team-invite-section">
      <StepperHeader
        title="Invite Team Members"
        subtitle={`Send invitations to colleagues to join your organization. You can invite up to ${maxInvites} members at once.`}
      />

      <Stack spacing={2} sx={{ mb: 3 }}>
        {invites.map((invite, index) => (
          <Box key={index} display="flex" alignItems="flex-start" gap={2}>
            <TextField
              fullWidth
              label="Email Address"
              value={invite.email}
              onChange={(e) => onChangeEmail(index, e.target.value)}
              error={Boolean(invite.error)}
              helperText={invite.error ?? ''}
              placeholder="colleague@company.com"
              variant="outlined"
              size="small"
              inputProps={{ 'data-test-id': `invite-email-${index}` }}
            />
            {invites.length > 1 ? (
              <IconButton
                aria-label="remove-email"
                onClick={() => onRemove(index)}
                color="error"
                size="small"
                data-test-id={`remove-invite-${index}`}
              >
                <DeleteIcon />
              </IconButton>
            ) : null}
          </Box>
        ))}

        <Box display="flex" justifyContent="flex-start">
          <Button
            startIcon={<AddIcon />}
            onClick={onAdd}
            variant="outlined"
            size="small"
            disabled={invites.length >= maxInvites}
            data-test-id="add-invite"
          >
            {invites.length >= maxInvites ? `Maximum ${maxInvites} invites reached` : 'Add Another Email'}
          </Button>
        </Box>
      </Stack>

      <Box display="flex" justifyContent="flex-end">
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          data-test-id="send-invitations"
        >
          {isSubmitting ? 'Sending Invitations...' : 'Send Invitations'}
        </Button>
      </Box>
    </Box>
  );
}