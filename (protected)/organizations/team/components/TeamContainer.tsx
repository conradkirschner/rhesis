'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/common/NotificationContext';
import { useTeamData } from '@/hooks/data/Team/useTeamData';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import TeamInviteForm from '../ui/TeamInviteForm';
import TeamMembersGrid from '../ui/TeamMembersGrid';
import DeleteModal from '../ui/DeleteModal';
import type {
  UiTeamInviteFormProps,
  UiTeamMembersGridProps,
  UiTeamMember,
} from '../ui/types';

const MAX_TEAM_MEMBERS = 10;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeamContainer() {
  const { data: session } = useSession();
  const notifications = useNotifications();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { members, totalCount, isLoading, error, inviteUsers, removeUser, refetch } = useTeamData({
    skip: page * pageSize,
    limit: pageSize,
  });

  const currentUserId = session?.user?.id;

  const [invites, setInvites] = useState<readonly { email: string; error?: string }[]>([{ email: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UiTeamMember | null>(null);

  const onAddInvite = () => {
    if (invites.length >= MAX_TEAM_MEMBERS) {
      notifications.show(`You can invite a maximum of ${MAX_TEAM_MEMBERS} team members at once.`, { severity: 'error' });
      return;
    }
    setInvites((prev) => [...prev, { email: '' }]);
  };

  const onRemoveInvite = (index: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== index));
  };

  const onChangeInvite = (index: number, value: string) => {
    setInvites((prev) => prev.map((row, i) => (i === index ? { email: value } : row)));
  };

  const validateInvites = (): { ok: boolean; emails: string[] } => {
    const trimmed = invites.map((r) => r.email.trim()).filter(Boolean);
    if (trimmed.length === 0) {
      notifications.show('Please enter at least one email address', { severity: 'error' });
      return { ok: false, emails: [] };
    }
    if (trimmed.length > MAX_TEAM_MEMBERS) {
      notifications.show(`You can invite a maximum of ${MAX_TEAM_MEMBERS} team members at once.`, { severity: 'error' });
      return { ok: false, emails: [] };
    }

    const lower = trimmed.map((e) => e.toLowerCase());
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    lower.forEach((e) => (seen.has(e) ? duplicates.add(e) : seen.add(e)));

    const next = invites.map((r) => ({ ...r }));
    let hasErr = false;
    next.forEach((row, idx) => {
      const v = row.email.trim();
      let msg: string | undefined;
      if (v && !emailRegex.test(v)) msg = 'Please enter a valid email address';
      else if (v && duplicates.has(v.toLowerCase())) msg = 'This email address is already added';
      next[idx].error = msg;
      if (msg) hasErr = true;
    });
    setInvites(next);

    return { ok: !hasErr, emails: trimmed };
  };

  const onSubmitInvites = async () => {
    const orgId = session?.user?.organization_id ?? '';
    if (!orgId) {
      notifications.show('No organization found on your session.', { severity: 'error' });
      return;
    }
    const { ok, emails } = validateInvites();
    if (!ok) return;

    try {
      setSubmitting(true);
      const { success, failed } = await inviteUsers(emails, orgId);

      if (success.length && !failed.length) {
        notifications.show(`Successfully sent ${success.length} invitation${success.length > 1 ? 's' : ''}!`, {
          severity: 'success',
        });
      } else if (success.length && failed.length) {
        const failedEmails = failed.map((f) => f.email);
        const uniqueErrors = Array.from(new Set(failed.map((f) => f.error))).filter(Boolean);
        let summary: string;
        const only = (uniqueErrors[0] ?? '').toLowerCase();
        if (uniqueErrors.length === 1 && only.includes('rate limit')) {
          summary = 'rate limit exceeded';
        } else if (uniqueErrors.length === 1 && only.includes('already belongs to an organization')) {
          summary = `${failedEmails.join(', ')} already belong${failedEmails.length === 1 ? 's' : ''} to another organization`;
        } else if (uniqueErrors.length === 1 && only.includes('already exists')) {
          summary = `${failedEmails.join(', ')} already exist${failedEmails.length === 1 ? 's' : ''}`;
        } else {
          summary = `${failedEmails.join(', ')} failed`;
        }
        notifications.show(`Sent ${success.length} invitation${success.length > 1 ? 's' : ''}. ${summary}.`, {
          severity: 'warning',
          autoHideDuration: 6000,
        });
      } else {
        const failedEmails = failed.map((f) => f.email);
        const uniqueErrors = Array.from(new Set(failed.map((f) => f.error))).filter(Boolean);
        const only = (uniqueErrors[0] ?? '').toLowerCase();
        let msg: string;
        if (uniqueErrors.length === 1 && only.includes('rate limit')) {
          msg = uniqueErrors[0]!;
        } else if (uniqueErrors.length === 1 && only.includes('already belongs to an organization')) {
          msg =
            failedEmails.length === 1
              ? `${failedEmails[0]} already belongs to another organization. They must leave their current organization first.`
              : `${failedEmails.join(', ')} already belong to another organization. They must leave their current organizations first.`;
        } else if (uniqueErrors.length === 1 && only.includes('already exists')) {
          msg = failedEmails.length === 1 ? `${failedEmails[0]} already exists.` : `${failedEmails.join(', ')} already exist.`;
        } else {
          msg = `Failed to invite ${failedEmails.join(', ')}.`;
        }
        notifications.show(msg, { severity: 'error', autoHideDuration: 6000 });
      }

      if (success.length > 0) {
        setInvites([{ email: '' }]);
        await refetch();
      }
    } catch {
      notifications.show('Failed to send invitations. Please try again.', { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRemove = (id: string) => {
    const target = members.find((m) => m.id === id) || null;
    setUserToDelete(target ?? null);
    setDeleteDialogOpen(Boolean(target));
  };

  const handleConfirmRemove = async () => {
    if (!userToDelete?.id) return;
    try {
      setDeleting(true);
      await removeUser(userToDelete.id);
      notifications.show(`Successfully removed ${userToDelete.displayName} from the organization.`, { severity: 'success' });
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Failed to remove user from organization. Please try again.';
      notifications.show(msg, { severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const uiMembers: readonly UiTeamMember[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        email: m.email,
        displayName: m.displayName,
        picture: m.picture,
        status: m.status,
      })) satisfies readonly UiTeamMember[],
    [members],
  );

  if (error) {
    return (
      <FeaturePageFrame>
        <ErrorBanner message={error} />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame>
      {isLoading && !uiMembers.length ? <InlineLoader /> : null}

      <TeamInviteForm
        invites={invites}
        onChangeEmail={onChangeInvite}
        onAdd={onAddInvite}
        onRemove={onRemoveInvite}
        onSubmit={onSubmitInvites}
        isSubmitting={submitting}
        maxInvites={MAX_TEAM_MEMBERS}
      /> satisfies UiTeamInviteFormProps

      <TeamMembersGrid
        rows={uiMembers}
        totalCount={totalCount}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(model) => {
          setPage(model.page);
          setPageSize(model.pageSize);
        }}
        loading={isLoading}
        currentUserId={currentUserId}
        onRequestRemove={handleRequestRemove}
      /> satisfies UiTeamMembersGridProps

      <DeleteModal
        open={deleteDialogOpen}
        title="Remove from Organization"
        message={
          userToDelete
            ? `Are you sure you want to remove ${userToDelete.displayName} from the organization?\n\nThey will lose access to all organization resources but can be re-invited in the future. Their contributions to projects and tests will remain intact.`
            : ''
        }
        isLoading={deleting}
        confirmButtonText={deleting ? 'Removing...' : 'Remove from Organization'}
        onConfirm={handleConfirmRemove}
        onClose={() => (!deleting ? (setDeleteDialogOpen(false), setUserToDelete(null)) : undefined)}
      />
    </FeaturePageFrame>
  );
}