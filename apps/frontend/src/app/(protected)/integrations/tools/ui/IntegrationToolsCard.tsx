import { Box, Paper, Typography, Button, Stack, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { UiIntegrationToolsCardProps } from './types';

export default function IntegrationToolsCard({
  disabled,
  onAddClick,
}: UiIntegrationToolsCardProps) {
  return (
    <Stack spacing={3}>
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
          <Chip label="Coming soon" size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AddIcon
            sx={{
              fontSize: 32,
              color: 'grey.500',
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="text.secondary">
              Add Tool
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Connect to monitoring, logging, and analytics tools
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            disabled={disabled}
            onClick={onAddClick}
            data-test-id="add-tool"
            sx={{
              textTransform: 'none',
              borderRadius: 3,
            }}
          >
            Add Tool
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}