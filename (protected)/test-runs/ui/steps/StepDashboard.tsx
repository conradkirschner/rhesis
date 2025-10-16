'use client';

import * as React from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { BasePieChart, BaseChartsGrid } from '@/components/common/BaseCharts';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { ChatIcon, DescriptionIcon } from '@/components/icons';
import PersonIcon from '@mui/icons-material/Person';
import TestRunBaseDrawer from '@/components/common/BaseDrawer';
import { DeleteModal } from '@/components/common/DeleteModal';
import type {
  UiActionButton,
  UiEndpointOption,
  UiPaginationModel,
  UiPieDatum,
  UiProjectOption,
  UiTestRunRow,
  UiTestSetOption,
  UiUserOption,
} from '../types';

type ChartsProps = {
  status: readonly UiPieDatum[];
  results: readonly UiPieDatum[];
  testSets: readonly UiPieDatum[];
  executors: readonly UiPieDatum[];
};

type GridProps = {
  rows: readonly UiTestRunRow[];
  totalRows: number;
  loading: boolean;
  paginationModel: UiPaginationModel;
  onPaginationModelChange: (m: UiPaginationModel) => void;
  onRowClick: (id: string | number) => void;
  selection: readonly (string | number)[];
  onSelectionChange: (ids: readonly (string | number)[]) => void;
  actionButtons: readonly UiActionButton[];
};

type DrawerProps = {
  open: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: () => void;
  options: {
    users: readonly UiUserOption[];
    projects: readonly UiProjectOption[];
    testSets: readonly UiTestSetOption[];
    endpoints: readonly UiEndpointOption[];
  };
  values: {
    assignee: UiUserOption | null;
    owner: UiUserOption | null;
    project: UiProjectOption | null;
    testSet: UiTestSetOption | null;
    endpoint: UiEndpointOption | null;
  };
  onChange: {
    assignee: (u: UiUserOption | null) => void;
    owner: (u: UiUserOption | null) => void;
    project: (p: UiProjectOption | null) => void;
    testSet: (t: UiTestSetOption | null) => void;
    endpoint: (e: UiEndpointOption | null) => void;
  };
};

type DeleteModalProps = {
  open: boolean;
  loading: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
};

type Props = {
  charts: ChartsProps;
  grid: GridProps;
  drawer: DrawerProps;
  deleteModal: DeleteModalProps;
};

const CHART_TITLES = {
  status: 'Test Runs by Status',
  results: 'Test Runs by Result',
  tests: 'Most Run Test Sets',
  executors: 'Top Test Executors',
} as const;

export default function StepDashboard({ charts, grid, drawer, deleteModal }: Props) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <BaseChartsGrid>
        <BasePieChart title={CHART_TITLES.status} data={charts.status} useThemeColors colorPalette="pie" />
        <BasePieChart title={CHART_TITLES.results} data={charts.results} useThemeColors colorPalette="pie" />
        <BasePieChart title={CHART_TITLES.tests} data={charts.testSets} useThemeColors colorPalette="pie" />
        <BasePieChart title={CHART_TITLES.executors} data={charts.executors} useThemeColors colorPalette="pie" />
      </BaseChartsGrid>

      <Box sx={{ mt: 2 }}>
        <BaseDataGrid
          rows={grid.rows}
          columns={[
            {
              field: 'name',
              headerName: 'Name',
              flex: 1,
              valueGetter: (_v: unknown, row: UiTestRunRow) => row.name,
            },
            {
              field: 'testSetName',
              headerName: 'Test Sets',
              flex: 1,
              valueGetter: (_v: unknown, row: UiTestRunRow) => row.testSetName ?? '',
            },
            {
              field: 'totalTests',
              headerName: 'Total Tests',
              flex: 1,
              align: 'right',
              headerAlign: 'right',
              valueGetter: (_v: unknown, row: UiTestRunRow) => row.totalTests,
            },
            {
              field: 'executionTime',
              headerName: 'Execution Time',
              flex: 1,
              align: 'right',
              headerAlign: 'right',
              renderCell: (params: { row: UiTestRunRow }) => {
                const status = params.row.status?.toLowerCase() ?? '';
                if (status === 'progress') return 'In Progress';
                if (status === 'completed') {
                  const ms = params.row.totalExecutionTimeMs ?? 0;
                  const seconds = ms / 1000;
                  if (seconds < 60) return `${Math.round(seconds)}s`;
                  if (seconds < 3600) return `${Math.round((seconds / 60) * 10) / 10}m`;
                  return `${Math.round((seconds / 3600) * 10) / 10}h`;
                }
                return '';
              },
            },
            {
              field: 'status',
              headerName: 'Status',
              flex: 1,
              renderCell: (params: { row: UiTestRunRow }) =>
                params.row.status ? <Chip label={params.row.status} size="small" variant="outlined" /> : null,
            },
            {
              field: 'executor',
              headerName: 'Executor',
              flex: 1,
              renderCell: (params: { row: UiTestRunRow }) =>
                params.row.executor ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={params.row.executor.picture ?? undefined} sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">{params.row.executor.displayName}</Typography>
                  </Box>
                ) : null,
            },
            {
              field: 'comments',
              headerName: 'Comments',
              width: 100,
              sortable: false,
              filterable: false,
              renderCell: (p: { row: UiTestRunRow }) => {
                const count = p.row.counts?.comments ?? 0;
                if (!count) return null;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">{count}</Typography>
                  </Box>
                );
              },
            },
            {
              field: 'tasks',
              headerName: 'Tasks',
              width: 100,
              sortable: false,
              filterable: false,
              renderCell: (p: { row: UiTestRunRow }) => {
                const count = p.row.counts?.tasks ?? 0;
                if (!count) return null;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">{count}</Typography>
                  </Box>
                );
              },
            },
          ]}
          loading={grid.loading}
          getRowId={(row: UiTestRunRow) => row.id}
          paginationModel={grid.paginationModel}
          onPaginationModelChange={grid.onPaginationModelChange}
          onRowSelectionModelChange={(ids) => grid.onSelectionChange(ids)}
          rowSelectionModel={grid.selection}
          onRowClick={(params: { id: string | number }) => grid.onRowClick(params.id)}
          serverSidePagination
          totalRows={grid.totalRows}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          actionButtons={grid.actionButtons}
          disablePaperWrapper
        />
      </Box>

      <TestRunBaseDrawer
        open={drawer.open}
        onClose={drawer.onClose}
        title="Test Run Configuration"
        loading={drawer.loading}
        error={drawer.error}
        onSave={drawer.onSave}
        saveButtonText="Execute Now"
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Workflow
          </Typography>

          {/* Assignee */}
          <AutocompleteField
            label="Assignee"
            options={drawer.options.users}
            value={drawer.values.assignee}
            onChange={drawer.onChange.assignee}
          />

          {/* Owner */}
          <AutocompleteField
            label="Owner"
            required
            options={drawer.options.users}
            value={drawer.values.owner}
            onChange={drawer.onChange.owner}
          />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            Test Run Configuration
          </Typography>

          {/* Test Set */}
          <SimpleAutocomplete
            label="Test Set"
            required
            getOptionLabel={(o) => o.name}
            options={drawer.options.testSets}
            value={drawer.values.testSet}
            onChange={drawer.onChange.testSet}
          />

          {/* Project */}
          <SimpleAutocomplete
            label="Application"
            required
            getOptionLabel={(o) => o.name}
            options={drawer.options.projects}
            value={drawer.values.project}
            onChange={drawer.onChange.project}
          />

          {/* Endpoint */}
          <SimpleAutocomplete
            label="Endpoint"
            required
            disabled={!drawer.values.project}
            helperText={!drawer.values.project ? 'Select an application first' : undefined}
            getOptionLabel={(o) => `${o.name} (${o.environment})`}
            options={drawer.options.endpoints}
            value={drawer.values.endpoint}
            onChange={drawer.onChange.endpoint}
          />
        </Box>
      </TestRunBaseDrawer>

      <DeleteModal
        open={deleteModal.open}
        onClose={deleteModal.onCancel}
        onConfirm={deleteModal.onConfirm}
        isLoading={deleteModal.loading}
        title="Delete Test Runs"
        message={`Are you sure you want to delete ${deleteModal.count} test run${
          deleteModal.count === 1 ? '' : 's'
        }? Don't worry, related data will not be deleted, only ${
          deleteModal.count === 1 ? 'this record' : 'these records'
        }.`}
        itemType="test runs"
      />
    </Box>
  );
}

/** Presentational Autocomplete fields */

import {
  Autocomplete,
  TextField,
  Stack,
} from '@mui/material';

function AutocompleteField({
  label,
  options,
  value,
  onChange,
  required,
}: {
  label: string;
  options: readonly UiUserOption[];
  value: UiUserOption | null;
  onChange: (v: UiUserOption | null) => void;
  required?: boolean;
}) {
  return (
    <Autocomplete
      options={[...options]}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(o) => o.displayName}
      isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={option.picture} sx={{ width: 24, height: 24 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            {option.displayName}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          InputProps={{
            ...params.InputProps,
            startAdornment: value ? (
              <Avatar src={value.picture} sx={{ width: 24, height: 24, mr: 1 }}>
                <PersonIcon fontSize="small" />
              </Avatar>
            ) : undefined,
          }}
        />
      )}
    />
  );
}

function SimpleAutocomplete<T extends { id: string | number }>({
  label,
  options,
  value,
  onChange,
  getOptionLabel,
  required,
  helperText,
  disabled,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T | null) => void;
  getOptionLabel: (o: T) => string;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
}) {
  return (
    <Autocomplete<T, false, false, false>
      options={[...options]}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} helperText={helperText} />
      )}
    />
  );
}