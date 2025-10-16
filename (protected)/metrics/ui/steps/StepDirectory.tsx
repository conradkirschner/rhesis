'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ClearIcon from '@mui/icons-material/Clear';
import type { UiBehaviorRef, UiFilterOptions, UiFilterState, UiMetricItem } from '../types';
import { DeleteModal } from '@/components/common/DeleteModal';
import Chip as MuiChip from '@mui/material/Chip';
import ApiIcon from '@mui/icons-material/Api';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';

type Props = {
  readonly items: readonly UiMetricItem[];
  readonly behaviors: readonly UiBehaviorRef[];
  readonly filters: UiFilterState;
  readonly filterOptions: UiFilterOptions;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onFiltersChange: (next: UiFilterState) => void;
  readonly onOpenMetricDetail: (metricId: string) => void;
  readonly onAssignMetric: (metricId: string, behaviorId: string) => void | Promise<void>;
  readonly onDeleteMetric: (metricId: string) => void | Promise<void>;
  readonly onCreateMetric: (typeSlug: string) => void;
};

function MetricCard({
  item,
  onOpen,
  onAssignClick,
  onDeleteClick,
}: {
  readonly item: UiMetricItem;
  readonly onOpen: () => void;
  readonly onAssignClick: () => void;
  readonly onDeleteClick?: () => void;
}) {
  const theme = useTheme();
  const usedIn = (item.usedIn ?? []) as readonly string[];
  const hasUsage = usedIn.length > 0;
  const canDelete = !hasUsage && (item.backend ?? '').toLowerCase() === 'custom';

  return (
    <Box
      sx={{
        position: 'relative',
        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
        minWidth: { xs: '100%', sm: 300, md: 320 },
        maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: (th) => th.shape.borderRadius * 0.25,
        p: 2,
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, zIndex: 1 }}>
        <IconButton size="small" onClick={onOpen} data-test-id="open-metric">
          <OpenInNewIcon fontSize="inherit" />
        </IconButton>
        <IconButton size="small" onClick={onAssignClick} data-test-id="assign-metric">
          <AddIcon fontSize="inherit" />
        </IconButton>
        {canDelete ? (
          <IconButton size="small" onClick={onDeleteClick} data-test-id="delete-metric">
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        ) : null}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '2.5em' }}>
        {item.description}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {item.backend ? <Chip size="small" variant="outlined" label={capitalize(item.backend)} /> : null}
        {item.metricType ? <Chip size="small" variant="outlined" label={metricTypeDisplay(item.metricType)} /> : null}
        {item.scoreType ? <Chip size="small" variant="outlined" label={capitalize(item.scoreType)} /> : null}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {hasUsage ? `Used in: ${usedIn.join(', ')}` : ''}
      </Typography>
    </Box>
  );
}

export default function StepDirectory({
  items,
  behaviors,
  filters,
  filterOptions,
  isLoading: _isLoading,
  error: _error,
  onFiltersChange,
  onOpenMetricDetail,
  onAssignMetric,
  onDeleteMetric,
  onCreateMetric,
}: Props) {
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selectedMetric, setSelectedMetric] = React.useState<UiMetricItem | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<UiMetricItem | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const theme = useTheme();

  const activeFilters =
    filters.search !== '' ||
    filters.backend.length > 0 ||
    filters.type.length > 0 ||
    filters.scoreType.length > 0;

  const handleReset = () =>
    onFiltersChange({ search: '', backend: [], type: [], scoreType: [] });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              placeholder="Search metrics..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              variant="filled"
              hiddenLabel
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
              data-test-id="new-metric"
            >
              New Metric
            </Button>
            {activeFilters && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleReset}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Reset
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
              <InputLabel id="backend-filter-label">Backend</InputLabel>
              <Select
                labelId="backend-filter-label"
                multiple
                value={filters.backend}
                label="Backend"
                onChange={(e) => onFiltersChange({ ...filters, backend: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).length === 0 ? (
                      <em>Select backend</em>
                    ) : (
                      (selected as string[]).map((v) => <Chip key={v} label={v} size="small" />)
                    )}
                  </Box>
                )}
                MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
              >
                <MenuItem disabled value="">
                  <em>Select backend</em>
                </MenuItem>
                {filterOptions.backend.map((b) => (
                  <MenuItem key={b} value={b.toLowerCase()}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
              <InputLabel id="type-filter-label">Metric Type</InputLabel>
              <Select
                labelId="type-filter-label"
                multiple
                value={filters.type}
                label="Metric Type"
                onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).length === 0 ? (
                      <em>Select metric type</em>
                    ) : (
                      (selected as string[]).map((v) => (
                        <Chip key={v} label={humanize(v)} size="small" />
                      ))
                    )}
                  </Box>
                )}
                MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
              >
                <MenuItem disabled value="">
                  <em>Select metric type</em>
                </MenuItem>
                {filterOptions.type.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    <Box>
                      <Typography>{humanize(t.value)}</Typography>
                      {t.description ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t.description}
                        </Typography>
                      ) : null}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
              <InputLabel id="score-type-filter-label">Score Type</InputLabel>
              <Select
                labelId="score-type-filter-label"
                multiple
                value={filters.scoreType}
                label="Score Type"
                onChange={(e) => onFiltersChange({ ...filters, scoreType: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).length === 0 ? (
                      <em>Select score type</em>
                    ) : (
                      (selected as string[]).map((v) => (
                        <Chip
                          key={v}
                          label={filterOptions.scoreType.find((s) => s.value === (v as 'binary' | 'numeric'))?.label ?? v}
                          size="small"
                        />
                      ))
                    )}
                  </Box>
                )}
                MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
              >
                <MenuItem disabled value="">
                  <em>Select score type</em>
                </MenuItem>
                {filterOptions.scoreType.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ p: 3 }}>
        <Stack
          spacing={3}
          sx={{
            '& > *': {
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 3,
              '& > *': {
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
                minWidth: { xs: '100%', sm: 300, md: 320 },
                maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {items.map((m) => (
              <MetricCard
                key={m.id}
                item={m}
                onOpen={() => onOpenMetricDetail(m.id)}
                onAssignClick={() => {
                  setSelectedMetric(m);
                  setAssignOpen(true);
                }}
                onDeleteClick={() => {
                  setDeleteTarget(m);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </Box>
        </Stack>
      </Box>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogTitle>Add to Behavior</DialogTitle>
        <DialogContent>
          <DialogContentText>Select a behavior to add this metric to:</DialogContentText>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {[...behaviors]
              .filter((b) => (b.name ?? '').trim() !== '')
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((b) => (
                <Button
                  key={b.id}
                  variant="outlined"
                  onClick={() => {
                    if (selectedMetric) onAssignMetric(selectedMetric.id, b.id);
                    setAssignOpen(false);
                    setSelectedMetric(null);
                  }}
                  fullWidth
                >
                  {b.name}
                </Button>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete modal */}
      <DeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) onDeleteMetric(deleteTarget.id);
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        isLoading={false}
        itemType="metric"
        itemName={deleteTarget?.title}
      />

      {/* Create metric dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create a custom metric for your evaluation</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {[
              { slug: 'custom-prompt', title: 'Evaluation Prompt', description: 'Evaluates the response using a LLM judge and a custom evaluation prompt', icon: <ChatIcon /> },
              { slug: 'custom-code', title: 'Code Evaluation', description: 'Evaluates the response using the code provided', icon: <CodeIcon />, disabled: true },
              { slug: 'api-call', title: 'API Call', description: 'Uses an external API service to check the response', icon: <ApiIcon />, disabled: true },
            ].map((opt) => (
              <Box
                key={opt.slug}
                onClick={() => {
                  if (!opt.disabled) onCreateMetric(opt.slug);
                }}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: (th) => th.shape.borderRadius * 0.25,
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  opacity: opt.disabled ? 0.7 : 1,
                  '&:hover': { bgcolor: opt.disabled ? undefined : 'action.hover' },
                  transition: 'background-color 0.2s',
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1.5, color: 'primary.main', display: 'flex', alignItems: 'center', opacity: opt.disabled ? 0.5 : 1 }}>
                    {opt.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ flex: 1, color: opt.disabled ? 'text.disabled' : 'text.primary' }}>
                    {opt.title}
                  </Typography>
                  {opt.disabled ? (
                    <MuiChip
                      label="Coming Soon"
                      size="small"
                      sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: theme?.typography?.chartLabel?.fontSize || '0.75rem' }}
                    />
                  ) : null}
                </Box>
                <Typography variant="body2" color={opt.disabled ? 'text.disabled' : 'text.secondary'}>
                  {opt.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function humanize(v: string) {
  return v.replace(/-/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function capitalize(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}