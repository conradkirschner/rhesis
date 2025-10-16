'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import type { UiBehaviorSection, UiMetricItem } from '../types';

type Props = {
  readonly sections: readonly UiBehaviorSection[];
  readonly organizationId: string;
  readonly onOpenMetricDetail: (metricId: string) => void;
  readonly onRemoveMetric: (behaviorId: string, metricId: string) => void | Promise<void>;
  readonly onCreateSection: (name: string, description: string | null) => void | Promise<void>;
  readonly onUpdateSection: (behaviorId: string, name: string, description: string | null) => void | Promise<void>;
  readonly onDeleteSection: (behaviorId: string) => void | Promise<void>;
};

export default function StepSelected({
  sections,
  organizationId: _organizationId,
  onOpenMetricDetail,
  onRemoveMetric,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
}: Props) {
  const theme = useTheme();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<{ id?: string; name: string; description: string | null } | null>(null);
  const isNew = !editing?.id;

  const openCreate = () => {
    setEditing({ name: '', description: '' });
    setDrawerOpen(true);
  };
  const openEdit = (section: UiBehaviorSection) => {
    setEditing({ id: section.id, name: section.name, description: section.description });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (isNew) {
      await onCreateSection(editing.name, editing.description ?? null);
    } else {
      await onUpdateSection(editing.id as string, editing.name, editing.description ?? null);
    }
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!editing?.id) return;
    await onDeleteSection(editing.id);
    setDrawerOpen(false);
    setEditing(null);
  };

  return (
    <Box sx={{ width: '100%', px: theme.spacing(3), pb: theme.spacing(4) }}>
      {[...sections]
        .filter((s) => (s.name ?? '').trim() !== '')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            onOpenDetail={onOpenMetricDetail}
            onRemove={(metricId) => onRemoveMetric(section.id, metricId)}
            onEdit={() => openEdit(section)}
          />
        ))}

      <Box
        sx={{
          mt: 4,
          p: 3,
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: (th) => th.shape.borderRadius * 0.25,
          display: 'flex',
          justifyContent: 'center',
          mb: 8,
        }}
      >
        <Button startIcon={<AddIcon />} onClick={openCreate} sx={{ color: 'text.secondary' }} data-test-id="add-dimension">
          Add New Dimension
        </Button>
      </Box>

      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isNew ? 'Add New Dimension' : 'Edit Dimension'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={editing?.name ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...(prev ?? {}), name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={editing?.description ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...(prev ?? {}), description: e.target.value }))}
              fullWidth
              multiline
              rows={4}
            />
            {!isNew ? (
              <>
                <Divider />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  fullWidth
                  data-test-id="delete-dimension"
                >
                  Delete Dimension
                </Button>
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} data-test-id="save-dimension">
            {isNew ? 'Add Dimension' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SectionBlock({
  section,
  onOpenDetail,
  onRemove,
  onEdit,
}: {
  readonly section: UiBehaviorSection;
  readonly onOpenDetail: (metricId: string) => void;
  readonly onRemove: (metricId: string) => void;
  readonly onEdit: () => void;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ mb: theme.spacing(4) }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: theme.spacing(1),
          pb: theme.spacing(1),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: theme.typography.fontWeightBold, color: theme.palette.text.primary }}>
          {section.name}
        </Typography>
        <IconButton onClick={onEdit} size="small" sx={{ color: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.action.hover } }} data-test-id="edit-dimension">
          <EditIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(3) }}>
        {section.description || 'No description provided'}
      </Typography>

      {section.metrics.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: theme.spacing(3),
            width: '100%',
            px: 0,
          }}
        >
          {section.metrics.map((metric) => (
            <MetricTile key={metric.id} metric={metric} onOpenDetail={() => onOpenDetail(metric.id)} onRemove={() => onRemove(metric.id)} />
          ))}
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: theme.spacing(3),
            textAlign: 'center',
            backgroundColor: theme.palette.action.hover,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing(2),
            borderRadius: theme.shape.borderRadius,
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: theme.typography.fontWeightMedium }}>
            No metrics assigned to this behavior
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function MetricTile({
  metric,
  onOpenDetail,
  onRemove,
}: {
  readonly metric: UiMetricItem;
  readonly onOpenDetail: () => void;
  readonly onRemove: () => void;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: (th) => th.shape.borderRadius * 0.25, p: 2 }}>
      <Box sx={{ position: 'absolute', top: theme.spacing(1), right: theme.spacing(1), display: 'flex', gap: theme.spacing(0.5), zIndex: 1 }}>
        <IconButton
          size="small"
          onClick={onOpenDetail}
          sx={{
            padding: '2px',
            '& .MuiSvgIcon-root': { fontSize: theme?.typography?.helperText?.fontSize || '0.75rem', color: 'currentColor' },
          }}
          data-test-id="open-metric-detail"
        >
          <OpenInNewIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{
            padding: '2px',
            '& .MuiSvgIcon-root': { fontSize: theme?.typography?.helperText?.fontSize || '0.75rem', color: 'currentColor' },
          }}
          data-test-id="remove-metric-from-behavior"
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
        {metric.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {metric.description}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {metric.backend ? <Chip size="small" variant="outlined" label={capitalize(metric.backend)} /> : null}
        {metric.metricType ? <Chip size="small" variant="outlined" label={metricTypeDisplay(metric.metricType)} /> : null}
        {metric.scoreType ? <Chip size="small" variant="outlined" label={capitalize(metric.scoreType)} /> : null}
      </Box>
    </Box>
  );
}

import Chip from '@mui/material/Chip';

function metricTypeDisplay(metricType: string): string {
  const mapping: Record<string, string> = {
    'custom-prompt': 'LLM Judge',
    'api-call': 'External API',
    'custom-code': 'Script',
    grading: 'Grades',
    framework: 'Framework',
  };
  return mapping[metricType] ?? humanize(metricType);
}
function humanize(v: string) {
  return v.replace(/-/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function capitalize(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}