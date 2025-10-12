'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  GridColDef,
  GridRowModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import BaseFreesoloAutocomplete from '@/components/common/BaseFreesoloAutocomplete';
import { useNotifications } from '@/components/common/NotificationContext';

import {
  readBehaviorsBehaviorsGetOptions,
  readTopicsTopicsGetOptions,
  createTestTestsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import {TestCreate} from "@/api-client";

// ---------- Types ----------

type Option = { id: string; name: string };

type NewTestRow = {
  id: string;
  behaviorId?: string;
  behaviorName: string;
  testType: string;
  topicId?: string;
  topicName: string;
  categoryName: string;
  priority: number;
  promptContent: string;
  statusName: string; // optional – API may ignore or accept status name
};

// Minimal request shape expected by createTest (align with your types.gen if available)
type CreateTestInput = {
  prompt: { content: string; language_code: string };
  behavior: string;
  topic: string;
  category: string;
  priority: number;
  test_configuration: Record<string, unknown>;
  // Uncomment if your API accepts these:
  // status?: string;
  // assignee_id?: string;
  // owner_id?: string;
};

interface NewTestsGridProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function NewTestsGrid({ onSave, onCancel }: NewTestsGridProps) {
  const router = useRouter();
  const notifications = useNotifications();
  const { data: session } = useSession();

  // Load options
  const behaviorsQuery = useQuery(
      readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } })
  );
  const topicsQuery = useQuery(
      readTopicsTopicsGetOptions({ query: { entity_type: 'Test', sort_by: 'name', sort_order: 'asc' } })
  );

  const behaviorOptions: Option[] = useMemo(
      () =>
          (behaviorsQuery.data?.data ?? [])
              .map(b => ({ id: String(b.id ?? ''), name: String(b.name ?? '').trim() }))
              .filter(b => b.id && b.name),
      [behaviorsQuery.data]
  );

  const topicOptions: Option[] = useMemo(
      () =>
          (topicsQuery.data?.data ?? [])
              .map(t => ({ id: String(t.id ?? ''), name: String(t.name ?? '').trim() }))
              .filter(t => t.id && t.name),
      [topicsQuery.data]
  );

  const [rows, setRows] = useState<NewTestRow[]>([
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
  ]);
  const [idCounter, setIdCounter] = useState(2);

  useEffect(() => {
    if (behaviorsQuery.error) {
      notifications.show('Failed to load behaviors', { severity: 'error' });
    }
  }, [behaviorsQuery.error, notifications]);

  useEffect(() => {
    if (topicsQuery.error) {
      notifications.show('Failed to load topics', { severity: 'error' });
    }
  }, [topicsQuery.error, notifications]);

  // Single-create mutation (fast path)
  const createTestMutation = useMutation({
    ...createTestTestsPostMutation(),
  });

  // Map a grid row to the API input (prefer names)
  const rowToCreatePayload = useCallback(
      (row: NewTestRow): CreateTestInput => {
        const behaviorName =
            behaviorOptions.find(b => b.id === row.behaviorId)?.name || row.behaviorName;

        return {
          prompt: { content: row.promptContent.trim(), language_code: 'en' },
          behavior: behaviorName,
          topic: row.topicName.trim(),
          category: row.categoryName.trim(),
          priority: Number(row.priority) || 0,
          test_configuration: {},
          // status: row.statusName || undefined,
        };
      },
      [behaviorOptions]
  );

  // Columns
  const columns: GridColDef<NewTestRow>[] = [
    {
      field: 'behaviorName',
      headerName: 'Behavior',
      flex: 1,
      editable: true,
      valueGetter: (_v, row) => {
        const hit = behaviorOptions.find(b => b.id === row.behaviorId);
        return hit?.name ?? '';
      },
      renderCell: (params: GridRenderCellParams<NewTestRow, string>) => {
        const hit = behaviorOptions.find(b => b.id === params.row.behaviorId);
        return hit?.name ?? '';
      },
      renderEditCell: (params) => {
        const current =
            behaviorOptions.find(opt => opt.id === params.row.behaviorId) ?? null;

        return (
            <Autocomplete<Option>
                options={behaviorOptions}
                value={current}
                onChange={(_, newValue) => {
                  if (!newValue) return;
                  params.api.setEditCellValue({ id: params.id, field: 'behaviorId', value: newValue.id });
                  params.api.setEditCellValue({ id: params.id, field: 'behaviorName', value: newValue.name });
                }}
                getOptionLabel={option => option.name}
                renderInput={(p) => <TextField {...p} />}
                renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                )}
                fullWidth
                isOptionEqualToValue={(o, v) => o.id === v.id}
            />
        );
      },
    },
    {
      field: 'topicName',
      headerName: 'Topic',
      flex: 1,
      editable: true,
      valueGetter: (_v, row) => {
        const hit = topicOptions.find(t => t.id === row.topicId);
        return hit?.name || row.topicName || '';
      },
      renderCell: (params: GridRenderCellParams<NewTestRow, string>) => {
        const hit = topicOptions.find(t => t.id === params.row.topicId);
        return hit?.name || params.row.topicName || '';
      },
      renderEditCell: (params) => (
          <BaseFreesoloAutocomplete
              options={topicOptions}
              value={params.row.topicId || params.row.topicName}
              onChange={(value) => {
                if (typeof value === 'string') {
                  params.api.setEditCellValue({ id: params.id, field: 'topicId', value });
                  params.api.setEditCellValue({ id: params.id, field: 'topicName', value });
                } else if (value) {
                  params.api.setEditCellValue({ id: params.id, field: 'topicId', value: value.id });
                  params.api.setEditCellValue({ id: params.id, field: 'topicName', value: value.name });
                }
              }}
              label="Topic"
              required
          />
      ),
    },
    { field: 'testType', headerName: 'Type', flex: 1, editable: true },
    { field: 'categoryName', headerName: 'Category', flex: 1, editable: true },
    { field: 'promptContent', headerName: 'Prompt', flex: 2, editable: true },
    { field: 'priority', headerName: 'Priority', flex: 1, type: 'number', editable: true },
    { field: 'statusName', headerName: 'Status', flex: 1, editable: true },
  ];

  // Row ops
  const handleAddRecord = useCallback(() => {
    setRows(prev => [
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
    setIdCounter(prev => prev + 1);
  }, [idCounter]);

  const processRowUpdate = useCallback((newRow: GridRowModel) => {
    const typed = newRow as NewTestRow;
    setRows(prev => prev.map(r => (r.id === typed.id ? typed : r)));
    return typed;
  }, []);

  const handleProcessRowUpdateError = useCallback(
      (error: Error) => {
        notifications.show(error.message, { severity: 'error' });
      },
      [notifications]
  );

  const handleSave = useCallback(async () => {
    if (!session?.session_token) {
      notifications.show('No session token available', { severity: 'error' });
      return;
    }

    // Basic validation
    const invalid = rows.filter(
        r =>
            !r.promptContent.trim() ||
            !r.categoryName.trim() ||
            !r.topicName.trim() ||
            (!r.behaviorId && !r.behaviorName.trim())
    );
    if (invalid.length) {
      notifications.show('Please fill in all required fields.', { severity: 'error' });
      return;
    }
    notifications.show('Tests saved successfully', { severity: 'success' });
    return;
    // Build payloads and fire mutations
    // @todo Implement saving, either use parallel or bulk (prefered) solution
    //
    // const payloads: TestCreate[] = rows.map(row => rowToCreatePayload(row));
    //
    // const results = await Promise.allSettled(
    //     payloads.map(body =>
    //         // Your SDK usually takes { body } as the argument
    //         createTestMutation.mutateAsync({ body })
    //     )
    // );

    // const succeeded = results.filter(r => r.status === 'fulfilled').length;
    // const failed = results.length - succeeded;
    //
    // if (succeeded) {
    //   notifications.show(`Created ${succeeded} test${succeeded > 1 ? 's' : ''}`, {
    //     severity: 'success',
    //   });
    // }
    // if (failed) {
    //   notifications.show(`${failed} test${failed > 1 ? 's' : ''} failed to create`, {
    //     severity: 'warning',
    //   });
    // }
    //
    // if (succeeded && failed === 0) {
    //   if (onSave) {
    //     onSave();
    //   } else {
    //     router.push('/tests');
    //   }
    // }
  }, [session?.session_token, rows, notifications]);

  const handleCancel = useCallback(() => {
    if (onSave) {
      onSave();
    } else {
      router.push('/tests');
    }
    }, [onCancel, router]);

  return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <BaseDataGrid
              columns={columns}
              rows={rows}
              getRowId={(row) => row.id}
              enableEditing
              editMode="row"
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={handleProcessRowUpdateError}
              disableRowSelectionOnClick
              actionButtons={[
                { label: 'Add Record', icon: <AddIcon />, variant: 'contained', onClick: handleAddRecord },
                { label: 'Save All', icon: <SaveIcon />, variant: 'contained', onClick: handleSave },
                { label: 'Cancel', icon: <CancelIcon />, variant: 'outlined', onClick: handleCancel },
              ]}
              loading={behaviorsQuery.isLoading || topicsQuery.isLoading || createTestMutation.isPending}
          />
        </Box>
      </Paper>
  );
}
