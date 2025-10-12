'use client';

import { useMutation } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';
import BaseWorkflowSection from '@/components/common/BaseWorkflowSection';

import type { TestUpdate, User} from '@/api-client/types.gen';
import { updateTestTestsTestIdPutMutation } from '@/api-client/@tanstack/react-query.gen';

interface TestWorkflowSectionProps {
  status?: string;
  priority?: number;
  assignee?: User | null;
  owner?: User | null;
  testId: string;
  onStatusChange?: (newStatus: string) => void;
  onPriorityChange?: (newPriority: number) => void;
  onAssigneeChange?: (newAssignee: User | null) => void;
  onOwnerChange?: (newOwner: User | null) => void;
}

export default function TestWorkflowSection({
                                              status = 'In Review',
                                              priority = 1,
                                              assignee,
                                              owner,
                                              testId,
                                              onStatusChange,
                                              onPriorityChange,
                                              onAssigneeChange,
                                              onOwnerChange,
                                            }: TestWorkflowSectionProps) {
  const notifications = useNotifications();

  const updateMutation = useMutation({
    ...updateTestTestsTestIdPutMutation(),
    onSuccess: () => {
      notifications.show('Test updated successfully', { severity: 'success' });
    },
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error('Error updating test:', err);
      notifications.show('Failed to update test', { severity: 'error' });
    },
  });

  const onUpdateEntity = async (updateData: Partial<TestUpdate>, fieldName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } =
        updateData;


    const body: Partial<TestUpdate> = {
      ...rest,
    };

    await updateMutation.mutateAsync({
      path: { test_id: testId },
      body,
    });

    // Field-specific toast to mirror previous behavior
    notifications.show(`${fieldName} updated successfully`, { severity: 'success' });
  };

  return (
      <BaseWorkflowSection
          title=""
          status={status}
          priority={priority}
          assignee={assignee ?? null}
          owner={owner ?? null}
          entityId={testId}
          entityType="Test"
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onAssigneeChange={onAssigneeChange}
          onOwnerChange={onOwnerChange}
          onUpdateEntity={onUpdateEntity}
      />
  );
}
