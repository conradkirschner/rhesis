'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import DeleteIcon from '@mui/icons-material/Delete';
import { GridColDef, GridFilterModel, GridPaginationModel, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { Typography, Box, Alert, Avatar, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField, CircularProgress, Stack, Divider, MenuItem, FormControl } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import BaseFreesoloAutocomplete, { AutocompleteOption as FreeSoloOption } from '@/components/common/BaseFreesoloAutocomplete';
import { ChatIcon, DescriptionIcon } from '@/components/icons';
import { convertGridFilterModelToOData } from '@/utils/odata-filter';
import type { UiTestRow, UiLookupSets, UiCreateTestFormData, UiPriority } from '../types';

type AutocompleteOption = FreeSoloOption;

type Props = {
  readonly rows: readonly UiTestRow[];
  readonly totalCount: number;
  readonly loading?: boolean;
  readonly error?: string;
  readonly page: number;
  readonly pageSize: number;
  readonly onPaginationChange: (model: GridPaginationModel) => void;
  readonly onFilterODataChange: (odata?: string) => void;
  readonly selectedIds: readonly string[];
  readonly onSelectedIdsChange: (ids: readonly string[]) => void;
  readonly onRowClick: (id: string) => void;
  readonly onDeleteSelected: () => void;
  readonly onAssociateSelected: (testSetId: string) => void;
  readonly onCreateTest: (data: UiCreateTestFormData) => void;
  readonly onGenerateTests: () => void;
  readonly onWriteMultiple: () => void;
  readonly lookups?: UiLookupSets;
};

type TestSetOption = { id: string; name: string };

const PRIORITY_OPTIONS: readonly UiPriority[] = ['Low', 'Medium', 'High', 'Urgent'] as const;

export default function StepTestsTable(props: Props) {
  const {
    rows,
    totalCount,
    loading,
    error,
    page,
    pageSize,
    onPaginationChange,
    onFilterODataChange,
    selectedIds,
    onSelectedIdsChange,
    onRowClick,
    onDeleteSelected,
    onAssociateSelected,
    onCreateTest,
    onGenerateTests,
    onWriteMultiple,
    lookups,
  } = props;

  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [selection, setSelection] = useState<GridRowSelectionModel>(selectedIds as string[]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [testSetDialogOpen, setTestSetDialogOpen] = useState(false);
  const [testSetSearch, setTestSetSearch] = useState('');
  const [selectedTestSet, setSelectedTestSet] = useState<TestSetOption | null>(null);

  React.useEffect(() => {
    setSelection(selectedIds as string[]);
  }, [selectedIds]);

  const handleSelectionChange = (next: GridRowSelectionModel) => {
    setSelection(next);
    onSelectedIdsChange(next as string[]);
  };

  const columns: GridColDef<UiTestRow>[] = useMemo(
    () => [
      {
        field: 'content',
        headerName: 'Content',
        flex: 3,
        filterable: true,
        renderCell: (params) => {
          const content = params.row.content ?? '';
          if (!content) return null;
          return (
            <Typography
              variant="body2"
              title={content}
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {content}
            </Typography>
          );
        },
      },
      {
        field: 'behaviorName',
        headerName: 'Behavior',
        flex: 1,
        filterable: true,
        renderCell: (params) => (params.row.behaviorName ? <Chip label={params.row.behaviorName} size="small" variant="outlined" /> : null),
      },
      {
        field: 'topicName',
        headerName: 'Topic',
        flex: 1,
        filterable: true,
        renderCell: (params) => (params.row.topicName ? <Chip label={params.row.topicName} size="small" variant="outlined" /> : null),
      },
      {
        field: 'categoryName',
        headerName: 'Category',
        flex: 1,
        filterable: true,
        renderCell: (params) => (params.row.categoryName ? <Chip label={params.row.categoryName} size="small" variant="outlined" /> : null),
      },
      {
        field: 'assigneeDisplay',
        headerName: 'Assignee',
        flex: 1,
        filterable: true,
        renderCell: (params) => {
          const displayName = params.row.assigneeDisplay;
          const picture = params.row.assigneePicture;
          if (!displayName) return null;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={picture ?? undefined} sx={{ width: 24, height: 24 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="body2">{displayName}</Typography>
            </Box>
          );
        },
      },
      {
        field: 'comments',
        headerName: 'Comments',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) =>
          params.row.comments ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{params.row.comments}</Typography>
            </Box>
          ) : null,
      },
      {
        field: 'tasks',
        headerName: 'Tasks',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) =>
          params.row.tasks ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{params.row.tasks}</Typography>
            </Box>
          ) : null,
      },
    ],
    [],
  );

  const handleRowClick = (params: GridRowParams<UiTestRow>) => {
    onRowClick(String(params.id));
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    onPaginationChange(model);
  };

  const handleFilterModelChange = (model: GridFilterModel) => {
    setFilterModel(model);
    const odata = convertGridFilterModelToOData(model);
    onFilterODataChange(odata || undefined);
  };

  const actionButtons = useMemo(() => {
    const buttons: {
      label: string;
      icon: React.ReactNode;
      variant: 'text' | 'outlined' | 'contained';
      color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
      onClick: () => void;
      splitButton?: { options: Array<{ label: string; onClick: () => void }> };
    }[] = [];

    buttons.push({
      label: 'Write Test',
      icon: <AddIcon />,
      variant: 'contained',
      onClick: () => setDrawerOpen(true),
      splitButton: {
        options: [
          {
            label: 'Write Multiple Tests',
            onClick: onWriteMultiple,
          },
        ],
      },
    });

    buttons.push({
      label: 'Generate Tests',
      icon: <AddIcon />,
      variant: 'contained',
      onClick: onGenerateTests,
    });

    if (selection.length > 0) {
      buttons.push({
        label: 'Assign to Test Set',
        icon: <ListIcon />,
        variant: 'contained',
        onClick: () => setTestSetDialogOpen(true),
      });

      buttons.push({
        label: 'Delete Tests',
        icon: <DeleteIcon />,
        variant: 'outlined',
        color: 'error',
        onClick: onDeleteSelected,
      });
    }

    return buttons;
  }, [selection.length, onDeleteSelected, onGenerateTests, onWriteMultiple]);

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {selection.length > 0 ? (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" color="primary">
            {selection.length} tests selected
          </Typography>
        </Box>
      ) : null}

      <BaseDataGrid
        rows={rows}
        columns={columns}
        loading={!!loading}
        getRowId={(row) => row.id}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={handlePaginationModelChange}
        actionButtons={actionButtons}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={handleSelectionChange}
        rowSelectionModel={selection}
        onRowClick={handleRowClick}
        serverSidePagination
        totalRows={totalCount}
        pageSizeOptions={[10, 25, 50]}
        serverSideFiltering
        onFilterModelChange={handleFilterModelChange}
        showToolbar
        disablePaperWrapper
      />

      {/* Create Drawer */}
      <CreateTestDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lookups={lookups}
        onCreate={onCreateTest}
      />

      {/* Assign Dialog */}
      <TestSetSelectionDialog
        open={testSetDialogOpen}
        loading={false}
        optionsFilter={testSetSearch}
        onOptionsFilterChange={setTestSetSearch}
        onClose={() => {
          setSelectedTestSet(null);
          setTestSetDialogOpen(false);
        }}
        options={[]}
        value={selectedTestSet}
        onChange={setSelectedTestSet}
        onConfirm={() => {
          if (selectedTestSet) onAssociateSelected(selectedTestSet.id);
          setSelectedTestSet(null);
          setTestSetDialogOpen(false);
        }}
      />
    </>
  );
}

/* ---------- Local UI-only pieces (presentational) ---------- */

function CreateTestDrawer({
  open,
  onClose,
  lookups,
  onCreate,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly lookups?: UiLookupSets;
  readonly onCreate: (data: UiCreateTestFormData) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState<UiCreateTestFormData>({
    statusId: '',
    assigneeId: undefined,
    ownerId: undefined,
    behaviorName: '',
    topicName: '',
    categoryName: '',
    priorityLevel: 'Medium',
    promptContent: '',
  });

  React.useEffect(() => {
    if (!open) {
      setError(undefined);
      setSubmitting(false);
      setForm({
        statusId: '',
        assigneeId: undefined,
        ownerId: undefined,
        behaviorName: '',
        topicName: '',
        categoryName: '',
        priorityLevel: 'Medium',
        promptContent: '',
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (!form.promptContent.trim()) throw new Error('Prompt content is required');
      if (!form.behaviorName.trim()) throw new Error('Behavior is required');
      if (!form.topicName.trim()) throw new Error('Topic is required');
      if (!form.categoryName.trim()) throw new Error('Category is required');
      if (!form.statusId) throw new Error('Status is required');

      await onCreate(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create test');
    } finally {
      setSubmitting(false);
    }
  };

  const srcOrUndefined = (src?: string | null) => src ?? undefined;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Test</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error ? (
            <Alert severity="error" onClose={() => setError(undefined)}>
              {error}
            </Alert>
          ) : null}

          <Typography variant="subtitle2" color="text.secondary">
            Workflow
          </Typography>

          <FormControl fullWidth>
            <TextField
              select
              label="Status"
              value={form.statusId}
              onChange={(e) => setForm((p) => ({ ...p, statusId: e.target.value }))}
              required
              inputProps={{ 'data-test-id': 'status-select' }}
            >
              {(lookups?.statuses ?? []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          <Autocomplete
            options={lookups?.users ?? []}
            value={(lookups?.users ?? []).find((u) => u.id === form.assigneeId) ?? null}
            onChange={(_, v) => setForm((p) => ({ ...p, assigneeId: v?.id }))}
            getOptionLabel={(o) => o.displayName}
            renderInput={(p) => (
              <TextField
                {...p}
                label="Assignee"
                InputProps={{
                  ...p.InputProps,
                  startAdornment: form.assigneeId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                      <Avatar
                        src={srcOrUndefined((lookups?.users ?? []).find((u) => u.id === form.assigneeId)?.picture)}
                        sx={{ width: 24, height: 24 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </Box>
                  ) : (
                    p.InputProps.startAdornment
                  ),
                }}
                inputProps={{ ...p.inputProps, 'data-test-id': 'assignee-input' }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <li key={option.id} {...rest}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={srcOrUndefined(option.picture)} sx={{ width: 32, height: 32 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography>{option.displayName}</Typography>
                  </Box>
                </li>
              );
            }}
          />

          <Autocomplete
            options={lookups?.users ?? []}
            value={(lookups?.users ?? []).find((u) => u.id === form.ownerId) ?? null}
            onChange={(_, v) => setForm((p) => ({ ...p, ownerId: v?.id }))}
            getOptionLabel={(o) => o.displayName}
            renderInput={(p) => (
              <TextField
                {...p}
                label="Owner"
                InputProps={{
                  ...p.InputProps,
                  startAdornment: form.ownerId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                      <Avatar
                        src={srcOrUndefined((lookups?.users ?? []).find((u) => u.id === form.ownerId)?.picture)}
                        sx={{ width: 24, height: 24 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </Box>
                  ) : (
                    p.InputProps.startAdornment
                  ),
                }}
                inputProps={{ ...p.inputProps, 'data-test-id': 'owner-input' }}
              />
            )}
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Test Details
          </Typography>

          <BaseFreesoloAutocomplete
            options={lookups?.behaviors ?? []}
            value={form.behaviorName}
            onChange={(v) =>
              setForm((p) => ({
                ...p,
                behaviorName: typeof v === 'string' ? v : v?.inputValue ?? v?.name ?? '',
              }))
            }
            label="Behavior"
            required
            data-test-id="behavior-input"
          />

          <BaseFreesoloAutocomplete
            options={lookups?.topics ?? []}
            value={form.topicName}
            onChange={(v) =>
              setForm((p) => ({
                ...p,
                topicName: typeof v === 'string' ? v : v?.inputValue ?? v?.name ?? '',
              }))
            }
            label="Topic"
            required
            data-test-id="topic-input"
          />

          <BaseFreesoloAutocomplete
            options={lookups?.categories ?? []}
            value={form.categoryName}
            onChange={(v) =>
              setForm((p) => ({
                ...p,
                categoryName: typeof v === 'string' ? v : v?.inputValue ?? v?.name ?? '',
              }))
            }
            label="Category"
            required
            data-test-id="category-input"
          />

          <FormControl fullWidth>
            <TextField
              select
              label="Priority"
              value={form.priorityLevel}
              onChange={(e) => setForm((p) => ({ ...p, priorityLevel: e.target.value as UiPriority }))}
              required
              inputProps={{ 'data-test-id': 'priority-select' }}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label="Prompt Content"
              value={form.promptContent}
              onChange={(e) => setForm((p) => ({ ...p, promptContent: e.target.value }))}
              multiline
              rows={4}
              required
              inputProps={{ 'data-test-id': 'prompt-content' }}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-test-id="cancel-create">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting} data-test-id="save-create">
          {submitting ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TestSetSelectionDialog({
  open,
  onClose,
  options,
  value,
  onChange,
  onConfirm,
  optionsFilter,
  onOptionsFilterChange,
  loading,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly options: readonly TestSetOption[];
  readonly value: TestSetOption | null;
  readonly onChange: (v: TestSetOption | null) => void;
  readonly onConfirm: () => void;
  readonly optionsFilter: string;
  readonly onOptionsFilterChange: (v: string) => void;
  readonly loading: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '500px',
          m: 0,
        },
      }}
    >
      <DialogTitle>Select Test Set</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={options as TestSetOption[]}
          value={value}
          inputValue={optionsFilter}
          onInputChange={(_, v) => onOptionsFilterChange(v)}
          onChange={(_, v) => onChange(v)}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(x) => x}
          loading={loading}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Test Sets"
              placeholder="Type to search test sets..."
              variant="outlined"
              margin="normal"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-test-id="cancel-assign">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={!value} data-test-id="confirm-assign">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}