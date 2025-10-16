import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTasksTasksGetOptions,
  deleteTaskTasksTaskIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';
// @see types.gen.ts
import type { PaginatedTaskDetail, TaskDetail } from '@/api-client/types.gen';

export interface UseTasksDataInput {
  readonly skip: number;
  readonly limit: number;
  readonly filter?: string;
  readonly headers?: Record<string, string>;
}

interface UseTasksDataOutput {
  readonly tasks: readonly TaskDetail[];
  readonly totalCount: number;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly refetch: () => Promise<PaginatedTaskDetail | undefined>;
  readonly deleteTasks: (ids: readonly string[]) => Promise<void>;
}

/**
 * Data hook for listing and deleting Tasks. Owns SDK I/O and composes reads & mutations.
 */
export function useTasksData({
  skip,
  limit,
  filter,
  headers,
}: UseTasksDataInput): UseTasksDataOutput {
  const queryClient = useQueryClient();

  const listOptions = React.useMemo(
    () =>
      listTasksTasksGetOptions({
        headers,
        query: {
          skip,
          limit,
          $filter: filter,
        },
      }),
    [headers, skip, limit, filter],
  );

  const listQuery = useQuery({
    ...listOptions,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const page: PaginatedTaskDetail | undefined = listQuery.data;
  const tasks = (page?.data ?? []) as readonly TaskDetail[];
  const totalCount = page?.pagination?.totalCount ?? 0;

  const deleteMutation = useMutation({
    ...deleteTaskTasksTaskIdDeleteMutation(),
  });

  const deleteTasks = React.useCallback(
    async (ids: readonly string[]) => {
      if (ids.length === 0) return;
      await Promise.all(
        ids.map((id) =>
          deleteMutation.mutateAsync({
            path: { task_id: String(id) },
          }),
        ),
      );
      // Prefer minimal invalidation; refetch the active list query.
      await queryClient.invalidateQueries({ queryKey: listOptions.queryKey });
      await listQuery.refetch();
    },
    [deleteMutation, listOptions.queryKey, listQuery, queryClient],
  );

  return {
    tasks,
    totalCount,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    errorMessage: listQuery.error?.message,
    refetch: async () => (await listQuery.refetch()).data,
    deleteTasks,
  };
}