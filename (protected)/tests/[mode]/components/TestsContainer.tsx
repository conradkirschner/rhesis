'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestsData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import StepNewTestsGrid from '../ui/steps/StepNewTestsGrid';
import type {
  UiNewTestRow,
  UiOption,
  UiStepNewTestsGridProps,
} from '../ui/types';

type Props = {
  readonly mode: string;
};

export default function TestsContainer({ mode }: Props) {
  const router = useRouter();
  const notifications = useNotifications();
  const { behaviorOptions, topicOptions, isLoadingLookups, errors, createMany, isCreating } = useTestsData();

  useEffect(() => {
    if (errors?.behaviors) notifications.show(errors.behaviors, { severity: 'error' });
    if (errors?.topics) notifications.show(errors.topics, { severity: 'error' });
  }, [errors, notifications]);

  const [rows, setRows] = useState<readonly UiNewTestRow[]>([
    {
      id: 'new-1',
      behaviorId: '',
      behaviorName: '',
      testType: '',
      topicId: '',
      topicName: '',
      categoryName: '',
      priority: 0,
      promptContent: '',
      statusName: '',
    },
  ] as const);

  const [idCounter, setIdCounter] = useState(2);

  const handleAdd = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: `new-${idCounter}`,
        behaviorId: '',
        behaviorName: '',
        testType: '',
        topicId: '',
        topicName: '',
        categoryName: '',
        priority: 0,
        promptContent: '',
        statusName: '',
      },
    ]);
    setIdCounter((c) => c + 1);
  }, [idCounter]);

  const handleProcessRowUpdate = useCallback((newRow: UiNewTestRow) => {
    setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
    return newRow;
  }, []);

  const handleProcessRowUpdateError = useCallback(
    (error: Error) => {
      notifications.show(error.message, { severity: 'error' });
    },
    [notifications],
  );

  const handleSave = useCallback(async () => {
    const invalid = rows.filter(
      (r) =>
        !r.promptContent.trim() ||
        !r.categoryName.trim() ||
        !r.topicName.trim() ||
        (!r.behaviorId && !r.behaviorName.trim()),
    );
    if (invalid.length) {
      notifications.show('Please fill in all required fields.', { severity: 'error' });
      return;
    }

    const inputs = rows.map((r) => ({
      behaviorId: r.behaviorId || undefined,
      behaviorName: r.behaviorName || undefined,
      testType: r.testType,
      topicId: r.topicId || undefined,
      topicName: r.topicName,
      categoryName: r.categoryName,
      priority: r.priority,
      promptContent: r.promptContent,
      statusName: r.statusName || undefined,
    })) as const;

    const { fulfilled, rejected } = await createMany(inputs);
    if (fulfilled) {
      notifications.show(`Created ${fulfilled} test${fulfilled > 1 ? 's' : ''}`, { severity: 'success' });
    }
    if (rejected) {
      notifications.show(`${rejected} test${rejected > 1 ? 's' : ''} failed to create`, { severity: 'warning' });
    }
    if (fulfilled && rejected === 0) {
      router.push('/tests');
    }
  }, [rows, createMany, notifications, router]);

  const handleCancel = useCallback(() => {
    router.push('/tests');
  }, [router]);

  const uiBehaviorOptions = useMemo(
    () => behaviorOptions as readonly UiOption[],
    [behaviorOptions],
  );
  const uiTopicOptions = useMemo(() => topicOptions as readonly UiOption[], [topicOptions]);

  const stepProps = {
    rows,
    behaviorOptions: uiBehaviorOptions,
    topicOptions: uiTopicOptions,
    onAdd: handleAdd,
    onSave: handleSave,
    onCancel: handleCancel,
    onRowUpdate: handleProcessRowUpdate,
    onRowUpdateError: handleProcessRowUpdateError,
    loading: isLoadingLookups || isCreating,
  } satisfies UiStepNewTestsGridProps;

  return (
    <FeaturePageFrame>
      <StepperHeader
        breadcrumbs={[
          { href: '/tests', label: 'Tests' },
          { href: `/tests/${mode}`, label: 'New Test' },
        ]}
        title="New Test"
        subtitle="Create one or more tests manually"
      />
      <ActionBar
        primaryActions={[
          { id: 'add-record', label: 'Add Record', onClick: handleAdd, variant: 'contained' },
          { id: 'save-all', label: 'Save All', onClick: handleSave, variant: 'contained' },
          { id: 'cancel', label: 'Cancel', onClick: handleCancel, variant: 'outlined' },
        ]}
      />
      <StepNewTestsGrid {...stepProps} />
    </FeaturePageFrame>
  );
}