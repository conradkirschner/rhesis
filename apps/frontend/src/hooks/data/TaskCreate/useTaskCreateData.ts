import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  readUsersUsersGetOptions,
  readStatusesStatusesGetOptions,
  readTypeLookupsTypeLookupsGetOptions,
  createTaskTasksPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import type {
  TaskCreate,
  Status,
  User,
  TypeLookup, StatusDetail,
} from '@/api-client/types.gen';

const ALLOWED_STATUS_NAMES = new Set(['Open', 'In Progress', 'Completed', 'Cancelled']);

type UserItem = Readonly<{
  id: string;
  name: string;
  email?: string;
  picture?: string;
}>;

type StatusItem = Readonly<{
  id: string;
  name: string;
}>;

type PriorityItem = Readonly<{
  id: string;
  label: string;
}>;

export function useTaskCreateData() {
  const usersQ = useQuery({
    ...readUsersUsersGetOptions({ query: { limit: 200 } }),
    staleTime: 60_000,
  });

  const statusesQ = useQuery({
    ...readStatusesStatusesGetOptions({
      query: { entity_type: 'Task', sort_by: 'name', sort_order: 'asc' },
    }),
    staleTime: 60_000,
  });

  const prioritiesQ = useQuery({
    ...readTypeLookupsTypeLookupsGetOptions({
      query: {
        $filter: "type_name eq 'TaskPriority'",
        sort_by: 'type_value',
        sort_order: 'asc',
        limit: 100,
      },
    }),
    staleTime: 300_000,
  });

  const users: readonly UserItem[] = useMemo(
    () =>
      (usersQ.data?.data ?? [])
        .filter((u: User) => !!u.id)
        .map((u: User) => ({
          id: u.id!,
          name: u.name ?? u.email ?? 'User',
          email: u.email ?? undefined,
          picture: u.picture ?? undefined,
        })),
    [usersQ.data?.data],
  );

  const statuses: readonly StatusItem[] = useMemo(
    () =>
      (statusesQ.data?.data ?? [])
        .filter((s: StatusDetail) => s?.id && s?.name && ALLOWED_STATUS_NAMES.has(s.name))
        .map((s: StatusDetail) => ({ id: s.id!, name: s.name! })),
    [statusesQ.data?.data],
  );

  const priorities: readonly PriorityItem[] = useMemo(
    () =>
      (prioritiesQ.data?.data ?? [])
        .filter((p: TypeLookup) => !!p.id)
        .map((p: TypeLookup) => ({ id: p.id!, label: p.type_value ?? '' })),
    [prioritiesQ.data?.data],
  );

  const createTaskMu = useMutation({
    ...createTaskTasksPostMutation(),
  });

  return {
    users,
    statuses,
    priorities,
    isLoading: usersQ.isLoading || statusesQ.isLoading || prioritiesQ.isLoading,
    error:
      (usersQ.isError && (usersQ.error as Error)?.message) ||
      (statusesQ.isError && (statusesQ.error as Error)?.message) ||
      (prioritiesQ.isError && (prioritiesQ.error as Error)?.message) ||
      null,
    async createTask(input: TaskCreate) {
      await createTaskMu.mutateAsync({ body: input });
    },
    isCreating: createTaskMu.isPending,
  } as const;
}