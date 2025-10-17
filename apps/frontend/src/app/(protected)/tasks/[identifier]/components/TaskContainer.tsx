'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTaskData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepDetails from '../ui/steps/StepDetails';
import type {
  UiBreadcrumb,
  UiTaskView,
  UiUserView,
} from '../ui/types';

type Props = {
  readonly identifier: string;
};

export default function TaskContainer({ identifier }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionToken = session?.session_token;

  const {
    task,
    users,
    isTaskLoading,
    isTaskError,
    taskErrorMessage,
    isUsersLoading,
    refetchTask,
    updateTask,
    isUpdating,
  } = useTaskData({ taskId: identifier, sessionToken });

  const breadcrumbs = useMemo<readonly UiBreadcrumb[]>(
    () =>
      [
        { title: 'Tasks', path: '/tasks' },
        { title: task?.title ?? 'Task', path: `/tasks/${identifier}` },
      ] as const,
    [identifier, task?.title],
  );

  if (isTaskLoading) {
    return (
      <FeaturePageFrame title="Loading…" breadcrumbs={breadcrumbs}>
        <InlineLoader
          title={isUsersLoading ? 'Loading task & users…' : 'Loading task…'}
          onBack={() => router.push('/tasks')}
          data-test-id="task-loader"
        />
      </FeaturePageFrame>
    );
  }

  if (isTaskError || !task) {
    return (
      <FeaturePageFrame title="Error" breadcrumbs={breadcrumbs}>
        <ErrorBanner
          message={taskErrorMessage || 'Failed to load task.'}
          onRetry={() => refetchTask()}
          onBack={() => router.push('/tasks')}
          data-test-id="task-error"
        />
      </FeaturePageFrame>
    );
  }

  const uiTask = {
    id: task.id ?? identifier,
    title: task.title ?? 'Untitled Task',
    description: task.description ?? '',
    statusId: task.status_id ?? '',
    priorityId: task.priority_id ?? '',
    assigneeId: task.assignee_id ?? '',
    creator: {
      id: task.user?.id ?? '',
      name: task.user?.name ?? 'Unknown',
      picture: task.user?.picture ?? undefined,
    },
    entityType: task.entity_type ?? undefined,
    entityId: task.entity_id ?? undefined,
    commentId: task.task_metadata?.comment_id ?? undefined,
  } satisfies UiTaskView;

  const uiUsers = users.map(
    (u) =>
      ({
        id: u.id ?? '',
        name: u.name ?? undefined,
        email: u.email ?? undefined,
        picture: u.picture ?? undefined,
      } satisfies UiUserView),
  ) as readonly UiUserView[];

  return (
    <FeaturePageFrame title={uiTask.title} breadcrumbs={breadcrumbs}>
      <StepperHeader title={uiTask.title} subtitle="Task details" />

      <StepDetails
        task={uiTask}
        users={uiUsers}
        isSaving={isUpdating}
        isUsersLoading={isUsersLoading}
        currentUser={
          session?.user
            ? { id: session.user.id ?? '', name: session.user.name ?? 'Unknown', picture: session.user.picture ?? undefined }
            : undefined
        }
        onNavigateToEntity={() => {
          if (uiTask.entityType && uiTask.entityId) {
            const entityPath = `${uiTask.entityType.toLowerCase()}s/${uiTask.entityId}`;
            const hash = uiTask.commentId ? `#comment-${uiTask.commentId}` : '';
            router.push(`/${entityPath}${hash}`);
          }
        }}
        onChangeStatus={(statusId) => updateTask({ status_id: statusId || undefined })}
        onChangePriority={(priorityId) => updateTask({ priority_id: priorityId || undefined })}
        onChangeAssignee={(assigneeId) => updateTask({ assignee_id: assigneeId || null })}
        onSaveTitle={(title) => updateTask({ title, description: uiTask.description || undefined, status_id: uiTask.statusId || undefined, priority_id: uiTask.priorityId || undefined, assignee_id: uiTask.assigneeId || undefined })}
        onSaveDescription={(description) => updateTask({ description, title: uiTask.title || undefined, status_id: uiTask.statusId || undefined, priority_id: uiTask.priorityId || undefined, assignee_id: uiTask.assigneeId || undefined })}
      />

      <ActionBar
        primaryLabel="Back to Tasks"
        onPrimary={() => router.push('/tasks')}
        data-test-id="task-action-bar"
      />
    </FeaturePageFrame>
  );
}