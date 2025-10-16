import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTaskTasksTaskIdGetOptions,
  readUsersUsersGetOptions,
  updateTaskTasksTaskIdPatchMutation,
} from '@/api-client/@tanstack/react-query.gen';

type Args = {
  readonly taskId: string;
  readonly sessionToken?: string;
};

export function useTaskData({ taskId, sessionToken }: Args) {
  const queryClient = useQueryClient();

  const headers = useMemo(
    () =>
      sessionToken
        ? ({
            Authorization: `Bearer ${sessionToken}`,
          } as const)
        : undefined,
    [sessionToken],
  );

  const taskOptions = useMemo(
    () =>
      getTaskTasksTaskIdGetOptions({
        headers,
        path: { task_id: taskId },
      }),
    [headers, taskId],
  );

  const usersOptions = useMemo(
    () => readUsersUsersGetOptions({ headers }),
    [headers],
  );

  const taskQuery = useQuery({
    ...taskOptions,
    enabled: Boolean(headers && taskId),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const usersQuery = useQuery({
    ...usersOptions,
    enabled: Boolean(headers),
    staleTime: 300_000,
  });

  const updateMutation = useMutation({
    ...updateTaskTasksTaskIdPatchMutation({ headers }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: taskOptions.queryKey });
      const previous = queryClient.getQueryData(taskOptions.queryKey);
      queryClient.setQueryData(taskOptions.queryKey, (prev) => {
        const base =
          (prev as Record<string, unknown>) ?? ({ id: taskId } as Record<string, unknown>);
        return { ...base, ...(variables.body as Record<string, unknown>) };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(taskOptions.queryKey, ctx.previous);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(taskOptions.queryKey, updated);
    },
  });

  const updateTask = useCallback(
    async (partial: {
      readonly title?: string;
      readonly description?: string;
      readonly status_id?: string;
      readonly priority_id?: string;
      readonly assignee_id?: string | null;
    }) => {
      await updateMutation.mutateAsync({
        path: { task_id: taskId },
        body: partial,
      });
    },
    [taskId, updateMutation],
  );

  return {
    task: (taskQuery.data ?? undefined) as
      | {
          id?: string;
          title?: string | null;
          description?: string | null;
          status_id?: string | null;
          priority_id?: string | null;
          assignee_id?: string | null;
          user?: { id?: string | null; name?: string | null; picture?: string | null } | null;
          entity_type?: string | null;
          entity_id?: string | null;
          task_metadata?: { comment_id?: string | null } | null;
        }
      | undefined,
    users:
      ((usersQuery.data as
        | readonly { id?: string | null; name?: string | null; email?: string | null; picture?: string | null }[]
        | undefined) ?? []) as readonly {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        picture?: string | null;
      }[],
    isTaskLoading: taskQuery.isLoading,
    isTaskError: taskQuery.isError,
    taskErrorMessage: taskQuery.error?.message ?? '',
    isUsersLoading: usersQuery.isLoading,
    refetchTask: () => taskQuery.refetch(),
    isUpdating: updateMutation.isPending,
    updateTask,
    taskQueryKey: taskOptions.queryKey,
    usersQueryKey: usersOptions.queryKey,
  } as const;
}