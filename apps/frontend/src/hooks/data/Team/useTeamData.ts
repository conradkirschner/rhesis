import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createUserUsersPostMutation,
  deleteUserUsersUserIdDeleteMutation,
  readUsersUsersGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import type { UserCreate } from '@/api-client/types.gen';

type Member = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly picture?: string;
  readonly status: 'active' | 'invited';
};

type UseTeamDataParams = {
  readonly skip: number;
  readonly limit: number;
};

type InviteResult = {
  readonly success: readonly string[];
  readonly failed: readonly { email: string; error: string }[];
};

const isActive = (u: Record<string, unknown>) =>
  Boolean(u['name'] || u['given_name'] || u['family_name'] || u['auth0_id']);

const toMember = (u: Record<string, unknown>): Member => {
  const given = String(u['given_name'] ?? '');
  const family = String(u['family_name'] ?? '');
  const full = String(u['name'] ?? `${given} ${family}`.trim());
  const email = String(u['email'] ?? '');
  const displayName = (full || email).trim();
  return {
    id: String(u['id'] ?? ''),
    email,
    displayName,
    picture: typeof u['picture'] === 'string' ? u['picture'] : undefined,
    status: isActive(u) ? 'active' : 'invited',
  };
};

/**
 * Compose team members read + invite + delete.
 */
export function useTeamData(params: UseTeamDataParams) {
  const { skip, limit } = params;
  const queryClient = useQueryClient();

  const usersOpts = readUsersUsersGetOptions({
    query: { skip, limit },
  });

  const usersQuery = useQuery({
    ...usersOpts,
    staleTime: 60_000,
    select: (payload: any) => {
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const totalCount = Number(payload?.pagination?.totalCount ?? 0);
      return {
        members: rows.map(toMember) as readonly Member[],
        totalCount,
      };
    },
  });

  const deleteUser = useMutation({
    ...deleteUserUsersUserIdDeleteMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersOpts.queryKey });
    },
  });

  const createUser = useMutation({
    ...createUserUsersPostMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersOpts.queryKey });
    },
  });

  const inviteUsers = async (emails: readonly string[], organizationId: string): Promise<InviteResult> => {
    const trimmed = emails.map((e) => e.trim()).filter(Boolean);
    const results: { email: string; ok: boolean; err?: string }[] = await Promise.all(
      trimmed.map(async (email) => {
        try {
          await createUser.mutateAsync({
            body: {
              email,
              organization_id: organizationId,
              is_active: true,
              send_invite: true,
            } as UserCreate,
          });
          return { email, ok: true };
        } catch (e) {
          const err = (e as Error)?.message || 'Invite failed';
          return { email, ok: false, err };
        }
      }),
    );

    const success = results.filter((r) => r.ok).map((r) => r.email);
    const failed = results
      .filter((r) => !r.ok)
      .map((r) => ({ email: r.email, error: r.err ?? 'Invite failed' }));

    return { success, failed };
  };

  const removeUser = async (userId: string) => {
    await deleteUser.mutateAsync({ path: { user_id: userId } });
  };

  return useMemo(
    () => ({
      members: usersQuery.data?.members ?? ([] as readonly Member[]),
      totalCount: usersQuery.data?.totalCount ?? 0,
      isLoading: usersQuery.isPending,
      isRefetching: usersQuery.isRefetching,
      error: usersQuery.isError ? (usersQuery.error as Error)?.message ?? 'Failed to load team' : null,
      refetch: usersQuery.refetch,
      inviteUsers,
      removeUser,
      queryKey: usersOpts.queryKey as readonly unknown[],
      pagination: { skip, limit } as const,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable primitives + query selects
    [usersQuery.data, usersQuery.isPending, usersQuery.isRefetching, usersQuery.isError, usersQuery.error, skip, limit],
  );
}

export type { Member, InviteResult };