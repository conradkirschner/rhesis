'use client';

import { useMutation } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';
import BaseWorkflowSection from '@/components/common/BaseWorkflowSection';

import type { TestSet, TestSetCreate, User, Tag } from '@/api-client/types.gen';

import { updateTestSetTestSetsTestSetIdPutMutation } from '@/api-client/@tanstack/react-query.gen';

interface TestSetWorkflowSectionProps {
  status?: string;
  priority?: number;
  assignee?: User | null;
  owner?: User | null;
  sessionToken: string;
  testSetId: string;
  onStatusChange?: (newStatus: string) => void;
  onPriorityChange?: (newPriority: number) => void;
  onAssigneeChange?: (newAssignee: User | null) => void;
  onOwnerChange?: (newOwner: User | null) => void;
}
function toTagObjects(
    tags: Tag[] | string[] | null | undefined
): Tag[] | undefined {
  if (!tags) return undefined;
  if (tags.length === 0) return [];
  return typeof (tags as Array<Tag | string>)[0] === 'string'
      ? (tags as string[])
          .filter((name) => name.trim().length > 0)
          .map((name) => ({ name } as Tag))
      : (tags as Tag[]);
}
export default function TestSetWorkflowSection({
                                                 status = 'In Review',
                                                 priority = 1,
                                                 assignee,
                                                 owner,
                                                 testSetId,
                                                 onStatusChange,
                                                 onPriorityChange,
                                                 onAssigneeChange,
                                                 onOwnerChange,
                                               }: TestSetWorkflowSectionProps) {
  const notifications = useNotifications();

  const updateMutation = useMutation({
    ...updateTestSetTestSetsTestSetIdPutMutation(),
    onSuccess: () => {
      notifications.show('Test set updated successfully', { severity: 'success' });
    },
    onError: (err) => {
      console.error('Error updating test set:', err);
      notifications.show('Failed to update test set', { severity: 'error' });
    },
  });

  const onUpdateEntity = async (updateData: Partial<TestSet>, fieldName: string) => {
    // Strip fields that are server-managed or not part of create/patch payload
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id: _id,
      tags: _tags,
      ...rest
    } = updateData;

    // Map tags to names if Tag objects are provided
    const body: Partial<TestSetCreate> = {
      ...rest,
      // TestSetCreate expects Tag[] | null | undefined for `tags`
      ...(toTagObjects(_tags) !== undefined ? { tags: toTagObjects(_tags) } : {}),
    };

    // Execute mutation (await to bubble errors to caller if needed)
    await updateMutation.mutateAsync({
      path: { test_set_id: testSetId },
      body,
    });

    // Field-specific toast (matches your previous UX)
    notifications.show(`${fieldName} updated successfully`, { severity: 'success' });
  };

  return (
      <BaseWorkflowSection
          title=""
          status={status}
          priority={priority}
          assignee={assignee ?? null}
          owner={owner ?? null}
          entityId={testSetId}
          entityType="TestSet"
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onAssigneeChange={onAssigneeChange}
          onOwnerChange={onOwnerChange}
          onUpdateEntity={onUpdateEntity}
      />
  );
}
