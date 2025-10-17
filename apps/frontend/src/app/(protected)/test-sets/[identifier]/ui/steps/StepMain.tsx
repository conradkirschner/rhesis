'use client';

import * as React from 'react';
import {
  BaseChartsGrid,
  BaseLineChart,
  BasePieChart,
} from '@/components/common/BaseCharts';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid';
import { pieChartUtils } from '@/components/common/BasePieChart';
import { TasksAndCommentsWrapper } from '@/components/tasks/TasksAndCommentsWrapper';
import BaseDrawer from '@/components/common/BaseDrawer';
import {
    Typography, Box, Chip, Paper , Autocomplete,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon, CallSplit as CallSplitIcon } from '@mui/icons-material';
import type {
  UiChartsProps,
  UiExecuteDrawerProps,
  UiStepMainProps,
  UiTestSetDetailsProps,
  UiTestsGridProps,
} from '../types';

function truncateName(name: string) {
  return pieChartUtils.truncateName(name);
}

export default function StepMain({ charts, details, grid, taskContext }: UiStepMainProps) {
  return (
    <Box sx={{ flexGrow: 1, pt: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Charts {...charts} />
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Details {...details} />
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid {...grid} />
      </Paper>

      {taskContext ? (
        <TasksAndCommentsWrapper
          entityType="TestSet"
          entityId={taskContext.entityId}
          currentUserId={taskContext.currentUserId}
          currentUserName={taskContext.currentUserName}
          currentUserPicture={taskContext.currentUserPicture}
        />
      ) : null}
    </Box>
  );
}

export function Charts({ stats }: UiChartsProps) {
  const lineData = React.useMemo(() => {
    if (!stats?.history?.monthly_counts) return [{ name: 'Current', count: stats?.total ?? 0 }];
    const entries = Object.entries(stats.history.monthly_counts as Record<string, number>);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
    return entries.map(([ym, count]) => {
      const [y, m] = ym.split('-');
      const idx = Number.parseInt(m ?? '', 10);
      const label = Number.isFinite(idx) && idx >= 1 && idx <= 12 ? `${monthNames[idx - 1]} ${y}` : ym;
      return { name: label, count };
    });
  }, [stats]);

  const yDomain = React.useMemo<[number, number]>(() => {
    const max = Math.max(0, ...lineData.map((d) => d.count));
    const mult = max <= 10 ? 2 : max <= 100 ? 1.5 : max <= 1000 ? 1.2 : 1.1;
    const upper = Math.ceil((max * mult) / 10) * 10;
    return [0, upper || 10];
  }, [lineData]);

  const pieDims = (['behavior', 'category', 'topic'] as const).map((dim) => {
    const breakdown = (stats?.stats?.[dim]?.breakdown ?? {}) as Record<string, number>;
    const total = stats?.stats?.[dim]?.total ?? 0;
    const data = pieChartUtils.generateDimensionData(breakdown, total, 5, [{ name: 'Loading...', value: 100 }]);
    const title = pieChartUtils.generateDimensionTitle(dim);
    return { dim, title, data };
  });

  return (
    <BaseChartsGrid>
      <BaseLineChart
        title="Total Tests"
        data={lineData}
        series={[{ dataKey: 'count', name: 'Tests Count', strokeWidth: 2 }]}
        useThemeColors
        colorPalette="line"
        height={180}
        legendProps={{ iconSize: 8, layout: 'horizontal' }}
        yAxisConfig={{ domain: yDomain, allowDataOverflow: true }}
      />
      {pieDims.map(({ dim, title, data }) => (
        <BasePieChart
          key={dim}
          title={title}
          data={data}
          useThemeColors
          colorPalette="pie"
          height={180}
          showPercentage
          tooltipProps={{
            formatter: (value: number, name: string, item: { payload: { percentage?: string; fullName?: string } }) => {
              const pct = item.payload.percentage ?? '';
              const full = item.payload.fullName ? truncateName(item.payload.fullName) : truncateName(name);
              return [`${value} (${pct})`, full] as [string, string];
            },
          }}
        />
      ))}
    </BaseChartsGrid>
  );
}

export function Details(props: UiTestSetDetailsProps) {
  const [editingName, setEditingName] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState(false);
  const [name, setName] = React.useState(props.name);
  const [description, setDescription] = React.useState(props.description);

  React.useEffect(() => setName(props.name), [props.name]);
  React.useEffect(() => setDescription(props.description), [props.description]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Test Set Details
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
        Name
      </Typography>
      {editingName ? (
        <TextField
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              props.onEditName(name);
              setEditingName(false);
            }
          }}
          sx={{ mb: 2 }}
          autoFocus
        />
      ) : (
        <Box sx={{ position: 'relative', mb: 3 }}>
          <Typography
            component="pre"
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              bgcolor: 'action.hover',
              borderRadius: (t) => t.shape.borderRadius * 0.25,
              p: 1,
              pr: 10,
              wordBreak: 'break-word',
              minHeight: 'calc(2 * 1.4375em + 2 * 8px)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {name}
          </Typography>
          <ButtonLike onClick={() => setEditingName(true)} label="Edit" />
        </Box>
      )}

      {editingName ? (
        <ConfirmBar
          confirmDisabled={props.updating}
          onCancel={() => {
            setEditingName(false);
            setName(props.name);
          }}
          onConfirm={() => {
            props.onEditName(name);
            setEditingName(false);
          }}
        />
      ) : null}

      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
        Description
      </Typography>
      {editingDescription ? (
        <TextField
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 1 }}
          autoFocus
        />
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Typography
            component="pre"
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              bgcolor: 'action.hover',
              borderRadius: (t) => t.shape.borderRadius * 0.25,
              p: 1,
              minHeight: 'calc(4 * 1.4375em + 2 * 8px)',
              pr: 10,
              wordBreak: 'break-word',
            }}
          >
            {props.description || ' '}
          </Typography>
          <ButtonLike onClick={() => setEditingDescription(true)} label="Edit" />
        </Box>
      )}

      {editingDescription ? (
        <ConfirmBar
          confirmDisabled={props.updating}
          onCancel={() => {
            setEditingDescription(false);
            setDescription(props.description);
          }}
          onConfirm={() => {
            props.onEditDescription(description);
            setEditingDescription(false);
          }}
        />
      ) : null}

      <Box sx={{ mt: 3 }}>
        <MetaList label="Behaviors" items={props.metadata.behaviors} />
        <MetaList label="Categories" items={props.metadata.categories} />
        <MetaList label="Topics" items={props.metadata.topics} />
      </Box>

      {props.metadata.sources.length > 0 ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Source Documents
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {props.metadata.sources.map((s, i) => (
              <Box
                key={`${s.document ?? s.name ?? 'doc'}-${i}`}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: (t) => t.shape.borderRadius * 0.25,
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {s.name ?? s.document ?? 'Unknown Document'}
                </Typography>
                {s.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {s.description}
                  </Typography>
                ) : null}
                {s.document && s.document !== s.name ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    File: {s.document}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function MetaList({ label, items }: { label: string; items: readonly string[] }) {
  if (!items.length) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No {label.toLowerCase()} defined
        </Typography>
      </Box>
    );
  }
  const maxVisible = 20;
  const visible = items.slice(0, maxVisible);
  const remaining = Math.max(0, items.length - maxVisible);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {visible.map((item, idx) => (
          <Chip key={`${item}-${idx}`} label={item} variant="outlined" size="small" />
        ))}
        {remaining > 0 ? <Chip label={`+${remaining}`} variant="outlined" size="small" /> : null}
      </Box>
    </Box>
  );
}

function ButtonLike({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      data-test-id={`button-${label.toLowerCase()}`}
      sx={(t) => ({
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        px: 1.25,
        py: 0.5,
        fontSize: t.typography.caption.fontSize,
        borderRadius: 1,
        border: `1px solid ${t.palette.divider}`,
        bgcolor: t.palette.background.paper,
        cursor: 'pointer',
        '&:hover': { bgcolor: t.palette.action.hover },
      })}
    >
      {label}
    </Box>
  );
}

function ConfirmBar({
  confirmDisabled,
  onCancel,
  onConfirm,
}: {
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 3 }}>
      <Box
        component="button"
        type="button"
        onClick={onCancel}
        data-test-id="cancel"
        sx={(t) => ({
          px: 2,
          py: 0.75,
          borderRadius: 1,
          border: `1px solid ${t.palette.error.main}`,
          color: t.palette.error.main,
          bgcolor: 'transparent',
          cursor: 'pointer',
        })}
      >
        Cancel
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onConfirm}
        data-test-id="confirm"
        sx={(t) => ({
          px: 2,
          py: 0.75,
          borderRadius: 1,
          border: `1px solid ${t.palette.primary.main}`,
          color: t.palette.primary.contrastText,
          bgcolor: t.palette.primary.main,
          cursor: 'pointer',
          opacity: confirmDisabled ? 0.6 : 1,
        })}
        disabled={confirmDisabled}
      >
        Confirm
      </Box>
    </Box>
  );
}

export function Grid({
  rows,
  totalRows,
  loading,
  pagination,
  onPaginationChange,
  onRowClick,
  onRemoveSelected,
  error,
  onRefetch,
}: UiTestsGridProps) {
  const [selection, setSelection] = React.useState<string[]>([]);

  const columns = React.useMemo<GridColDef<typeof rows[number]>[]>(
    () => [
      {
        field: 'promptContent',
        headerName: 'Prompt',
        flex: 3,
        renderCell: (params: GridRenderCellParams<typeof rows[number]>) => {
          const content = params.row.promptContent ?? '';
          if (!content) return null;
          return (
            <Typography
              variant="body2"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
              title={content}
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
        renderCell: (p: GridRenderCellParams<typeof rows[number]>) =>
          p.row.behaviorName ? <Chip label={p.row.behaviorName} variant="outlined" size="small" /> : null,
      },
      {
        field: 'topicName',
        headerName: 'Topic',
        flex: 1,
        renderCell: (p: GridRenderCellParams<typeof rows[number]>) =>
          p.row.topicName ? <Chip label={p.row.topicName} variant="outlined" size="small" /> : null,
      },
    ],
    [],
  );

  const actionButtons = React.useMemo(
    () =>
      selection.length
        ? [
            {
              label: `Remove ${selection.length} ${selection.length === 1 ? 'Test' : 'Tests'}`,
              icon: null,
              variant: 'outlined' as const,
              color: 'error' as const,
              onClick: () => onRemoveSelected(selection),
              disabled: loading,
            },
          ]
        : [],
    [selection, loading, onRemoveSelected],
  );

  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Tests
      </Typography>

      {error ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Box
              component="button"
              type="button"
              onClick={onRefetch}
              data-test-id="retry-tests"
              sx={(t) => ({
                px: 2,
                py: 0.75,
                borderRadius: 1,
                border: `1px solid ${t.palette.primary.main}`,
                color: t.palette.primary.main,
                bgcolor: 'transparent',
                cursor: 'pointer',
              })}
            >
              Retry
            </Box>
          </Box>
        </Box>
      ) : null}

      <BaseDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        paginationModel={{ page: pagination.page, pageSize: pagination.pageSize }}
        onPaginationModelChange={(m: GridPaginationModel) =>
          onPaginationChange({ page: m.page, pageSize: m.pageSize })
        }
        actionButtons={actionButtons}
        checkboxSelection
        onRowSelectionModelChange={(ids) => setSelection(ids as string[])}
        rowSelectionModel={selection}
        onRowClick={(p: GridRowParams<typeof rows[number]>) => onRowClick(String(p.id))}
        serverSidePagination
        rowCount={totalRows}
        disablePaperWrapper
      />
    </>
  );
}

function ExecuteDrawerRaw({
  open,
  onClose,
  loading,
  error,
  projects,
  endpoints,
  onExecute,
  filterEndpointsByProject,
}: UiExecuteDrawerProps) {
  const [project, setProject] = React.useState<string | null>(null);
  const [endpoint, setEndpoint] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'Parallel' | 'Sequential'>('Parallel');

  React.useEffect(() => {
    if (open) {
      setProject(null);
      setEndpoint(null);
      setMode('Parallel');
    }
  }, [open]);

  const filtered = project ? filterEndpointsByProject(project) : [];

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title="Execute Test Set"
      loading={loading}
      error={error ?? undefined}
      onSave={
        project && endpoint
          ? () => onExecute({ endpointId: endpoint, executionMode: mode })
          : undefined
      }
      saveButtonText="Execute Test Set"
    >
      <Stack spacing={3}>
        <Typography variant="subtitle2" color="text.secondary">
          Execution Target
        </Typography>

        <FormControl fullWidth>
          <Autocomplete
            options={projects}
            value={projects.find((p) => p.id === project) ?? null}
            onChange={(_, v) => {
              setProject(v ? v.id : null);
              setEndpoint(null);
            }}
            getOptionLabel={(o) => o.name}
            renderInput={(params) => <TextField {...params} label="Project" required placeholder="Select a project" />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={loading}
          />
          {!projects.length && !loading ? <FormHelperText>No projects available</FormHelperText> : null}
        </FormControl>

        <FormControl fullWidth>
          <Autocomplete
            options={filtered}
            value={filtered.find((e) => e.id === endpoint) ?? null}
            onChange={(_, v) => setEndpoint(v ? v.id : null)}
            getOptionLabel={(o) => o.name}
            disabled={!project}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Endpoint"
                required
                placeholder={project ? 'Select endpoint' : 'Select a project first'}
              />
            )}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            loading={loading}
          />
          {!filtered.length && project && !loading ? (
            <FormHelperText>No endpoints available for this project</FormHelperText>
          ) : null}
        </FormControl>

        <Divider />

        <Typography variant="subtitle2" color="text.secondary">
          Configuration Options
        </Typography>

        <FormControl fullWidth>
          <InputLabel>Execution Mode</InputLabel>
          <Select
            value={mode}
            onChange={(e) => setMode((e.target.value as 'Parallel' | 'Sequential') ?? 'Parallel')}
            label="Execution Mode"
          >
            <MenuItem value="Parallel">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CallSplitIcon fontSize="small" />
                <Box>
                  <Typography variant="body1">Parallel</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tests run simultaneously for faster execution (default)
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="Sequential">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowForwardIcon fontSize="small" />
                <Box>
                  <Typography variant="body1">Sequential</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tests run one after another, better for rate-limited endpoints
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </BaseDrawer>
  );
}

StepMain.ExecuteDrawer = ExecuteDrawerRaw;