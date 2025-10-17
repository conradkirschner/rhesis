import { Box, Button } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import type { UiActionBarProps } from './types';

export default function ActionBar({ onAdd }: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
      <Button
        variant="contained"
        startIcon={<AddRounded />}
        onClick={onAdd}
        data-test-id="action-add-provider"
      >
        Add Provider
      </Button>
    </Box>
  );
}