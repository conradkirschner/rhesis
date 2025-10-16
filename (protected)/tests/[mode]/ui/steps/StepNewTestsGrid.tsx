'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { Autocomplete, TextField } from '@mui/material';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import BaseFreesoloAutocomplete from '@/components/common/BaseFreesoloAutocomplete';
import type { UiNewTestRow, UiOption, UiStepNewTestsGridProps } from '../types';

type EditApi<R> = {
  setEditCellValue: (args: { id: string | number; field: keyof R & string; value: unknown }) => void;
};

type RenderParams<R> = {
  id: string | number;
  row: R;
  api: EditApi<R>;
};

type UiGridCol<R> = {
  readonly field: keyof R & string;
  readonly headerName: string;
  readonly flex?: number;
  readonly editable?: boolean;
  readonly type?: 'number' | 'string';
  readonly valueGetter?: (_v: unknown, row: R) => unknown;
  readonly renderCell?: (params: { row: R }) => unknown;
  readonly renderEditCell?: (params: RenderParams<R>) => unknown;
};

export default function StepNewTestsGrid(props: UiStepNewTestsGridProps) {
  const { rows, behaviorOptions, topicOptions, onRowUpdate, onRowUpdateError, loading } = props;

  const columns = useMemo<readonly UiGridCol<UiNewTestRow>[]>(() => {
    const findBehaviorName = (row: UiNewTestRow) =>
      behaviorOptions.find((b) => b.id === row.behaviorId)?.name ?? '';
    const findTopicName = (row: UiNewTestRow) =>
      topicOptions.find((t) => t.id === row.topicId)?.name || row.topicName || '';

    return [
      {
        field: 'behaviorName',
        headerName: 'Behavior',
        flex: 1,
        editable: true,
        valueGetter: (_v, row) => findBehaviorName(row),
        renderCell: ({ row }) => findBehaviorName(row),
        renderEditCell: (params) => {
          const current =
            behaviorOptions.find((opt) => opt.id === params.row.behaviorId) ?? null;

          return (
            <Autocomplete<UiOption>
              options={behaviorOptions as UiOption[]}
              value={current}
              onChange={(_e, newValue) => {
                if (!newValue) return;
                params.api.setEditCellValue({
                  id: params.id,
                  field: 'behaviorId',
                  value: newValue.id,
                });
                params.api.setEditCellValue({
                  id: params.id,
                  field: 'behaviorName',
                  value: newValue.name,
                });
              }}
              getOptionLabel={(o) => o.name}
              renderInput={(p) => <TextField {...p} />}
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
        valueGetter: (_v, row) => findTopicName(row),
        renderCell: ({ row }) => findTopicName(row),
        renderEditCell: (params) => (
          <BaseFreesoloAutocomplete
            options={topicOptions as UiOption[]}
            value={params.row.topicId || params.row.topicName}
            onChange={(value: string | UiOption | null) => {
              if (!value) return;
              if (typeof value === 'string') {
                params.api.setEditCellValue({ id: params.id, field: 'topicId', value });
                params.api.setEditCellValue({ id: params.id, field: 'topicName', value });
              } else {
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
    ] as const;
  }, [behaviorOptions, topicOptions]);

  return (
    <Box>
      <BaseDataGrid
        columns={columns as unknown as object[]}
        rows={rows as unknown as object[]}
        getRowId={(row: UiNewTestRow) => row.id}
        enableEditing
        editMode="row"
        processRowUpdate={onRowUpdate}
        onProcessRowUpdateError={onRowUpdateError}
        disableRowSelectionOnClick
        loading={loading}
      />
    </Box>
  );
}