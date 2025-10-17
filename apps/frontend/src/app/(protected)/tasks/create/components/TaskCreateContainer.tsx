'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EntityType, TaskCreate } from '@/api-client/types.gen';
import { useTaskCreateData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import { FeaturePageFrame } from '../ui/FeaturePageFrame';
import { StepForm } from '../ui/steps/StepForm';
import { InlineLoader } from '../ui/InlineLoader';
import { ErrorBanner } from '../ui/ErrorBanner';
import { ActionBar } from '../ui/ActionBar';
import type {
  UiPriorityOption,
  UiStatusOption,
  UiUserOption,
  UiTaskFormState,
} from '../ui/types';

export function TaskCreateContainer() {
  const router = useRouter();
  const { show } = useNotifications();
  const searchParams = useSearchParams();

  const { users, statuses, priorities, isLoading, error, createTask, isCreating } =
    useTaskCreateData();

  const userOptions: readonly UiUserOption[] = useMemo(
    () => users.map(u => ({ id: u.id, label: u.name, picture: u.picture })),
    [users],
  );

  const statusOptions: readonly UiStatusOption[] = useMemo(
    () => statuses.map(s => ({ id: s.id, name: s.name })),
    [statuses],
  );

  const priorityOptions: readonly UiPriorityOption[] = useMemo(
    () => priorities.map(p => ({ id: p.id, label: p.label })),
    [priorities],
  );

  const [form, setForm] = useState<UiTaskFormState>({
    title: '',
    description: '',
    statusId: '',
    priorityId: '',
    assigneeId: undefined,
    entityType: undefined,
    entityId: undefined,
    commentId: undefined,
  });

  // Prefill from URL params
  useEffect(() => {
    const entityType = searchParams.get('entityType') as EntityType | null;
    const entityId = searchParams.get('entityId') ?? undefined;
    const commentId = searchParams.get('commentId') ?? undefined;

    setForm(prev => ({
      ...prev,
      entityType: entityType ?? undefined,
      entityId,
      commentId,
    }));
  }, [searchParams]);

  // Defaults after data loads
  useEffect(() => {
    if (!form.statusId && statusOptions.length > 0) {
      const open = statusOptions.find(s => s.name === 'Open') ?? statusOptions[0];
      setForm(prev => ({ ...prev, statusId: open.id }));
    }
  }, [statusOptions, form.statusId]);

  useEffect(() => {
    if (!form.priorityId && priorityOptions.length > 0) {
      const medium =
        priorityOptions.find(p => p.label.toLowerCase() === 'medium') ??
        priorityOptions[0];
      setForm(prev => ({ ...prev, priorityId: medium.id }));
    }
  }, [priorityOptions, form.priorityId]);

  const handleChange = (patch: Partial<UiTaskFormState>) =>
    setForm(prev => ({ ...prev, ...patch }));

  const handleCancel = () => router.push('/tasks');

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      show('Please enter a task title', { severity: 'error' });
      return;
    }
    if (!form.statusId) {
      show('Please select a status', { severity: 'error' });
      return;
    }
    if (!form.priorityId) {
      show('Please select a priority', { severity: 'error' });
      return;
    }

    const payload: TaskCreate = {
      title: form.title,
      description: form.description,
      status_id: form.statusId,
      priority_id: form.priorityId,
      assignee_id: form.assigneeId || undefined,
      entity_type: form.entityType,
      entity_id: form.entityId,
      task_metadata: form.commentId ? { comment_id: form.commentId } : undefined,
    };

    try {
      await createTask(payload);
      show('Task created successfully', { severity: 'success' });
      router.push('/tasks');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create task';
      show(msg, { severity: 'error' });
    }
  };

  if (isLoading) {
    return (
      <FeaturePageFrame
        title="Create Task"
        breadcrumbs={[
          { title: 'Tasks', path: '/tasks' },
          { title: 'Create Task', path: '/tasks/create' },
        ]}
      >
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame
      title="Create Task"
      breadcrumbs={[
        { title: 'Tasks', path: '/tasks' },
        { title: 'Create Task', path: '/tasks/create' },
      ]}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <StepForm
        form={form}
        users={userOptions}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        isSaving={isCreating}
        onChange={handleChange}
      />

      <ActionBar
        primaryLabel={isCreating ? 'Creating...' : 'Create Task'}
        secondaryLabel="Cancel"
        onPrimary={handleSubmit}
        onSecondary={handleCancel}
        disabled={isCreating}
      />
    </FeaturePageFrame>
  );
}