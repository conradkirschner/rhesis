'use client';

import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { UiEmptyStateCardProps } from '../types';

export default function StepEmptyState({ badgeLabel, title, description, cta }: UiEmptyStateCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'action.hover',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Chip label={badgeLabel} size="small" variant="outlined" />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AddIcon sx={{ fontSize: theme => theme.iconSizes?.large ?? 32, color: 'grey.500' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          disabled={cta.disabled}
          onClick={cta.onClick}
          data-test-id={cta['data-test-id']}
          sx={{ textTransform: 'none', borderRadius: theme => theme.shape.borderRadius * 1.5 }}
        >
          {cta.label}
        </Button>
      </Box>
    </Paper>
  );
}