'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useState, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import { useNotifications } from '@/components/common/NotificationContext';

import type { Organization } from '@/api-client/types.gen';

import { useMutation } from '@tanstack/react-query';
import { leaveOrganizationUsersLeaveOrganizationPatchMutation } from '@/api-client/@tanstack/react-query.gen';

interface DangerZoneProps {
  organization: Organization;
  sessionToken: string;
}

const WarningList = styled('ul')(({ theme }) => ({
  margin: theme.spacing(1, 0),
  paddingLeft: theme.spacing(2.5),
}));

export default function DangerZone({ organization }: DangerZoneProps) {
  const notifications = useNotifications();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const orgName = useMemo(() => organization.name ?? '', [organization.name]);

  const leaveOrgMutation = useMutation(leaveOrganizationUsersLeaveOrganizationPatchMutation());
  const isLeaving = leaveOrgMutation.isPending;

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setConfirmText('');
    setError(null);
  };

  const handleCloseDialog = () => {
    if (!isLeaving) {
      setDialogOpen(false);
      setConfirmText('');
      setError(null);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!orgName) {
      setError('Organization name is unavailable. Please try again later.');
      return;
    }
    if (confirmText !== orgName) {
      setError(`Please type "${orgName}" exactly to confirm`);
      return;
    }

    setError(null);
    try {
      // Most generators use an empty payload for POST with no params
      await leaveOrgMutation.mutateAsync({});

      setDialogOpen(false);
      notifications.show(`You have left ${orgName}`, { severity: 'success' });

      await signOut({
        redirectTo: `/auth/signin?message=${encodeURIComponent(
            `You have successfully left ${orgName}. You can now create a new organization or accept an invitation.`
        )}`,
      });
    } catch (err) {
      console.error('Error leaving organization:', err);
      setError((err as unknown as Error)?.message ?? 'Failed to leave organization');
    }
  };

  return (
      <>
        <Box
            sx={{
              border: '2px solid',
              borderColor: 'error.main',
              borderRadius: (theme) => theme.shape.borderRadius,
              p: 3,
              backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                      ? alpha(theme.palette.error.main, 0.08)
                      : alpha(theme.palette.error.main, 0.04),
            }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <WarningAmberIcon color="error" sx={{ mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" color="error" gutterBottom>
                Danger Zone
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Leaving the organization will remove your access to all projects, tests, and data. Your contributions will
                remain, but you will no longer be able to access them.
              </Typography>
              <Button
                  variant="outlined"
                  color="error"
                  onClick={handleOpenDialog}
                  sx={{
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: 'error.main',
                      color: 'white',
                    },
                  }}
              >
                Leave Organization
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderTop: '4px solid',
                borderColor: 'error.main',
              },
            }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="error" />
              <Typography variant="h6">Leave Organization</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                This action is irreversible. You will:
              </Typography>
              <WarningList>
                <li>Lose access to all organization data and projects</li>
                <li>Need to be re-invited to rejoin this organization</li>
                <li>Go through the onboarding process again</li>
              </WarningList>
              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                Your contributions (tests, prompts, etc.) will remain in the organization.
              </Typography>
            </Alert>

            <Typography variant="body2" sx={{ mb: 2 }}>
              To confirm, please type the organization name:{' '}
              <Typography component="span" fontWeight="bold">
                {orgName || '—'}
              </Typography>
            </Typography>

            <TextField
                fullWidth
                placeholder={orgName ? `Type "${orgName}" to confirm` : 'Organization name unavailable'}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isLeaving || !orgName}
                error={!!error}
                helperText={error}
                autoFocus
                sx={{ mb: 2 }}
            />

            {isLeaving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Leaving organization...
                  </Typography>
                </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} disabled={isLeaving}>
              Cancel
            </Button>
            <Button
                variant="contained"
                color="error"
                onClick={handleLeaveOrganization}
                disabled={isLeaving || !orgName || confirmText !== orgName}
            >
              {isLeaving ? 'Leaving...' : 'Leave Organization'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
  );
}
