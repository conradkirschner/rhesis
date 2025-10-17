'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { Autocomplete, TextField } from '@mui/material';
import type {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
} from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import BaseFreesoloAutocomplete from '@/components/common/BaseFreesoloAutocomplete';
import type { UiNewTestRow, UiOption, UiStepNewTestsGridProps } from '../types';

export default function StepNewTestsGrid(props: UiStepNewTestsGridProps) {
  const { rows, behaviorOptions, topicOptions, onRowUpdate, onRowUpdateError, loading } = props;

  const behaviorOpts = useMemo<UiOption[]>(() => [...behaviorOptions], [behaviorOptions]);
  const topicOpts = useMemo<UiOption[]>(() => [...topicOptions], [topicOptions]);

  const findBehaviorName = (row: UiNewTestRow): string =>
      behaviorOpts.find((b) => b.id === row.behaviorId)?.name ?? '';

  const findTopicName = (row: UiNewTestRow): string =>
      topicOpts.find((t) => t.id === row.topicId)?.name || row.topicName || '';

  const columns = useMemo<readonly GridColDef<UiNewTestRow>[]>(() => {
    return [
      {
        field: 'behaviorName',
        headerName: 'Behavior',
        flex: 1,
        editable: true,
        renderCell: (params: GridRenderCellParams<UiNewTestRow>) => findBehaviorName(params.row),
        renderEditCell: (params: GridRenderEditCellParams<UiNewTestRow>) => {
          const current: UiOption | null =
              behaviorOpts.find((opt) => opt.id === params.row.behaviorId) ?? null;

          return (
              <Autocomplete<UiOption, false, false, false>
                  options={behaviorOpts}
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
        renderCell: (params: GridRenderCellParams<UiNewTestRow>) => findTopicName(params.row),
        renderEditCell: (params: GridRenderEditCellParams<UiNewTestRow>) => (
            <BaseFreesoloAutocomplete
                options={topicOpts}
                value={params.row.topicId || params.row.topicName || ''}
                onChange={(value: string | UiOption | null) => {
                  if (!value) return;
                  if (typeof value === 'string') {
                    params.api.setEditCellValue({ id: params.id, field: 'topicId', value });
                    params.api.setEditCellValue({ id: params.id, field: 'topicName', value });
                  } else {
                    params.api.setEditCellValue({ id: params.id, field: 'topicId', value: value.id });
                    params.api.setEditCellValue({
                      id: params.id,
                      field: 'topicName',
                      value: value.name,
                    });
                  }
                }}
                label="Topic"
                required
            />
        ),
      },
      { field: 'testType', headerName: 'Type', flex: 1, editable: true, type: 'string' },
      { field: 'categoryName', headerName: 'Category', flex: 1, editable: true, type: 'string' },
      { field: 'promptContent', headerName: 'Prompt', flex: 2, editable: true, type: 'string' },
      { field: 'priority', headerName: 'Priority', flex: 1, type: 'number', editable: true },
      { field: 'statusName', headerName: 'Status', flex: 1, editable: true, type: 'string' },
    ] as const;
  }, [behaviorOpts, topicOpts]);

  return (
      <Box>
        <BaseDataGrid
            columns={columns}
            rows={rows}
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
