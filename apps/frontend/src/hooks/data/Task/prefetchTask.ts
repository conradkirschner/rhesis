import { QueryClient } from '@tanstack/react-query';
import {
  getTaskTasksTaskIdGetOptions,
  readUsersUsersGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

type Args = {
  readonly taskId: string;
  readonly sessionToken?: string;
};

/** Prefetch Task detail + assignable users for SSR hydration. */
export async function prefetchTask(queryClient: QueryClient, { taskId, sessionToken }: Args) {
  const headers = sessionToken
    ? ({
        Authorization: `Bearer ${sessionToken}`,
      } as const)
    : undefined;

  const taskOptions = getTaskTasksTaskIdGetOptions({
    headers,
    path: { task_id: taskId },
  });

  const usersOptions = readUsersUsersGetOptions({ headers });

  await Promise.allSettled([
    queryClient.prefetchQuery({
      ...taskOptions,
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      ...usersOptions,
      staleTime: 300_000,
    }),
  ]);
}