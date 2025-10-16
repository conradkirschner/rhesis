'use client';

import * as React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/common/NotificationContext';
import { useMutation } from '@tanstack/react-query';

import { createUserUsersPostMutation } from '@/api-client/@tanstack/react-query.gen';

interface FormData {
  invites: { email: string }[];
}

interface TeamInviteFormProps {
  onInvitesSent?: (emails: string[]) => void;
}

export default function TeamInviteForm({ onInvitesSent }: TeamInviteFormProps) {
  const { data: session } = useSession();
  const notifications = useNotifications();

  const [formData, setFormData] = React.useState<FormData>({
    invites: [{ email: '' }],
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    [key: number]: { hasError: boolean; message: string };
  }>({});

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Maximum number of team members that can be invited
  const MAX_TEAM_MEMBERS = 10;

  // Generated mutation (POST /users)
  const createUserMutation = useMutation(createUserUsersPostMutation());

  const validateForm = () => {
    const newErrors: { [key: number]: { hasError: boolean; message: string } } =
        {};
    let hasError = false;

    // Check maximum team size
    const nonEmptyInvites = formData.invites.filter((invite) =>
        invite.email.trim()
    );
    if (nonEmptyInvites.length > MAX_TEAM_MEMBERS) {
      notifications.show(
          `You can invite a maximum of ${MAX_TEAM_MEMBERS} team members at once.`,
          { severity: 'error' }
      );
      return false;
    }

    // Get all non-empty emails for duplicate checking
    const emailsToCheck = formData.invites
        .map((invite, index) => ({
          email: invite.email.trim().toLowerCase(),
          index,
        }))
        .filter((item) => item.email);

    // Check for duplicates
    const seenEmails = new Set<string>();
    const duplicateEmails = new Set<string>();

    emailsToCheck.forEach(({ email }) => {
      if (seenEmails.has(email)) {
        duplicateEmails.add(email);
      } else {
        seenEmails.add(email);
      }
    });

    // Validate each email
    formData.invites.forEach((invite, index) => {
      const trimmedEmail = invite.email.trim();

      if (trimmedEmail) {
        // Check email format
        if (!emailRegex.test(trimmedEmail)) {
          newErrors[index] = {
            hasError: true,
            message: 'Please enter a valid email address',
          };
          hasError = true;
        }
        // Check for duplicates
        else if (duplicateEmails.has(trimmedEmail.toLowerCase())) {
          newErrors[index] = {
            hasError: true,
            message: 'This email address is already added',
          };
          hasError = true;
        }
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!session?.session_token) {
      notifications.show('Session expired. Please refresh the page.', {
        severity: 'error',
      });
      return;
    }

    const orgId = session.user?.organization_id ?? undefined;
    if (!orgId) {
      notifications.show('No organization found on your session.', {
        severity: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get valid emails
      const validEmails = formData.invites
          .map((invite) => invite.email.trim())
          .filter((email) => email);

      if (validEmails.length === 0) {
        notifications.show('Please enter at least one email address', {
          severity: 'error',
        });
        return;
      }

      const results: Array<{ email: string; success: boolean; error?: string }> =
          [];

      await Promise.all(
          validEmails.map(async (email) => {
            try {
              await createUserMutation.mutateAsync({
                body: {
                  email,
                  organization_id: orgId,
                  is_active: true,
                  // server triggers email on creation when this is true
                  send_invite: true , // keep as-is if your schema expects boolean
                }, // relax if your generated CreateUser type has more/less fields
              });
              results.push({ email, success: true });
            } catch (err: unknown) {

              results.push({ email, success: false, error: (err as Error).message });
            }
          })
      );

      const success = results.filter((r) => r.success).map((r) => r.email);
      const failed = results.filter((r) => !r.success);

      if (success.length && !failed.length) {
        notifications.show(
            `Successfully sent ${success.length} invitation${success.length > 1 ? 's' : ''}!`,
            { severity: 'success' }
        );
      } else if (success.length && failed.length) {
        const failedEmails = failed.map((f) => f.email);
        const uniqueErrors = Array.from(new Set(failed.map((f) => f.error))).filter(
            Boolean
        ) as string[];

        let summary: string;
        if (uniqueErrors.length === 1 && uniqueErrors[0].toLowerCase().includes('rate limit')) {
          summary = 'rate limit exceeded';
        } else if (
            uniqueErrors.length === 1 &&
            uniqueErrors[0].toLowerCase().includes('already belongs to an organization')
        ) {
          summary = `${failedEmails.join(', ')} already belong${
              failedEmails.length === 1 ? 's' : ''
          } to another organization`;
        } else if (
            uniqueErrors.length === 1 &&
            uniqueErrors[0].toLowerCase().includes('already exists')
        ) {
          summary = `${failedEmails.join(', ')} already exist${
              failedEmails.length === 1 ? 's' : ''
          }`;
        } else {
          summary = `${failedEmails.join(', ')} failed`;
        }

        notifications.show(
            `Sent ${success.length} invitation${success.length > 1 ? 's' : ''}. ${summary}.`,
            { severity: 'warning', autoHideDuration: 6000 }
        );
      } else {
        // all failed
        const failedEmails = failed.map((f) => f.email);
        const uniqueErrors = Array.from(new Set(failed.map((f) => f.error))).filter(
            Boolean
        ) as string[];

        let msg;
        if (uniqueErrors.length === 1 && uniqueErrors[0].toLowerCase().includes('rate limit')) {
          msg = uniqueErrors[0];
        } else if (
            uniqueErrors.length === 1 &&
            uniqueErrors[0].toLowerCase().includes('already belongs to an organization')
        ) {
          msg =
              failedEmails.length === 1
                  ? `${failedEmails[0]} already belongs to another organization. They must leave their current organization first.`
                  : `${failedEmails.join(', ')} already belong to another organization. They must leave their current organizations first.`;
        } else if (
            uniqueErrors.length === 1 &&
            uniqueErrors[0].toLowerCase().includes('already exists')
        ) {
          msg =
              failedEmails.length === 1
                  ? `${failedEmails[0]} already exists.`
                  : `${failedEmails.join(', ')} already exist.`;
        } else {
          msg = `Failed to invite ${failedEmails.join(', ')}.`;
        }

        notifications.show(msg, { severity: 'error', autoHideDuration: 6000 });
      }

      // Reset when any success
      if (success.length > 0) {
        setFormData({ invites: [{ email: '' }] });
        setErrors({});
        onInvitesSent?.(success);
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      notifications.show('Failed to send invitations. Please try again.', {
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const updatedInvites = [...formData.invites];
    updatedInvites[index] = { email: value };
    setFormData({ invites: updatedInvites });

    // Clear error when user types
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const addEmailField = () => {
    if (formData.invites.length >= MAX_TEAM_MEMBERS) {
      notifications.show(
          `You can invite a maximum of ${MAX_TEAM_MEMBERS} team members at once.`,
          { severity: 'error' }
      );
      return;
    }

    setFormData((prev) => ({ invites: [...prev.invites, { email: '' }] }));
  };

  const removeEmailField = (index: number) => {
    const updatedInvites = [...formData.invites];
    updatedInvites.splice(index, 1);
    setFormData({ invites: updatedInvites });

    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  return (
      <Box component="form" onSubmit={handleSubmit}>
        {/* Header Section */}
        <Box mb={3}>
          <Typography variant="h6" component="h2" gutterBottom>
            Invite Team Members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Send invitations to colleagues to join your organization. You can
            invite up to {MAX_TEAM_MEMBERS} members at once.
          </Typography>
        </Box>

        {/* Form Fields */}
        <Stack spacing={2} sx={{ mb: 3 }}>
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
                    size="small"
                />
                {formData.invites.length > 1 && (
                    <IconButton
                        onClick={() => removeEmailField(index)}
                        color="error"
                        size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                )}
              </Box>
          ))}

          <Box display="flex" justifyContent="flex-start">
            <Button
                startIcon={<AddIcon />}
                onClick={addEmailField}
                variant="outlined"
                size="small"
                disabled={formData.invites.length >= MAX_TEAM_MEMBERS}
            >
              {formData.invites.length >= MAX_TEAM_MEMBERS
                  ? `Maximum ${MAX_TEAM_MEMBERS} invites reached`
                  : 'Add Another Email'}
            </Button>
          </Box>
        </Stack>

        {/* Submit Button */}
        <Box display="flex" justifyContent="flex-end">
          <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                ) : (
                    <SendIcon />
                )
              }
          >
            {isSubmitting ? 'Sending Invitations...' : 'Send Invitations'}
          </Button>
        </Box>
      </Box>
  );
}
