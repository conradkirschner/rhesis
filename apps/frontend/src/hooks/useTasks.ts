'use client';

import { useMemo } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';

import {
  listTasksTasksGetOptions,
  getTaskTasksTaskIdGetOptions,
  createTaskTasksPostMutation,
  updateTaskTasksTaskIdPatchMutation,
  deleteTaskTasksTaskIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

/** Shared cache key helpers */
const taskKey  = (taskId: string)=> ['task', taskId];

/** Query params you commonly pass to /tasks. Adjust keys to your API if needed. */
export type TasksListQuery = {
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entity_type?: string;
  entity_id?: string;
  comment_id?: string;
};

/**
 * List tasks (optionally filtered).
 * Example:
 *   const { data, isLoading } = useTasksList({ entity_type: 'Test', entity_id: 'abc' });
 *   const rows = data?.data ?? [];
 */
export function useTasksList(query?: TasksListQuery, enabled = true) {
  return useQuery({
    ...listTasksTasksGetOptions({ query: query }),
    enabled,
  });
}

/**
 * Fetch tasks for a specific comment id via /tasks?comment_id=...
 * Example:
 *   const q = useTasksByCommentId(commentId, { limit: 50 });
 *   const tasks = q.data?.data ?? [];
 */
export function useTasksByCommentId(commentId: string | null | undefined, extras?: Omit<TasksListQuery, 'comment_id'>) {
  const enabled = Boolean(commentId);
  const query = useMemo<TasksListQuery>(
      () => ({ ...(extras ?? {}), comment_id: commentId ?? undefined }),
      [commentId, extras],
  );

  return useQuery({
    ...listTasksTasksGetOptions({ query }),
    enabled,
  });
}

/**
 * Get a single task
 */
export function useTask(taskId: string) {
  return useQuery({
    ...(getTaskTasksTaskIdGetOptions({ path: { task_id: taskId } })),
    enabled: Boolean(taskId),
  });
}

/**
 * Create Task
 */
export function useCreateTask() {
  const qc   = useQueryClient();
  const { show } = useNotifications();

  return useMutation({
    ...createTaskTasksPostMutation(),
    onSuccess: async () => {
      show('Task created successfully', { severity: 'success' });
      await qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message ?? 'Failed to create task';
      show(msg, { severity: 'error' });
    },
  });
}

/**
 * Update Task
 */
export function useUpdateTask() {
  const qc   = useQueryClient();
  const { show } = useNotifications();

  return useMutation({
    ...updateTaskTasksTaskIdPatchMutation(),
    onSuccess: async (_data, vars) => {
      // vars should carry path: { task_id }
      const taskId = (vars as { path: { task_id: string } }).path.task_id;
      show('Task updated successfully', { severity: 'success' });
      await Promise.all([
        qc.invalidateQueries({ queryKey: taskKey(taskId) }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message ?? 'Failed to update task';
      show(msg, { severity: 'error' });
    },
  });
}

/**
 * Delete Task
 */
export function useDeleteTask() {
  const qc   = useQueryClient();
  const { show } = useNotifications();

  return useMutation({
    ...deleteTaskTasksTaskIdDeleteMutation(),
    onSuccess: async () => {
      show('Task deleted successfully', { severity: 'success' });
      await qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message ?? 'Failed to delete task';
      show(msg, { severity: 'error' });
    },
  });
}
