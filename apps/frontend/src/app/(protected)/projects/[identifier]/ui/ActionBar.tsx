'use client';

import { Box, Button, Stack } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({ mode, onEdit, onSave, onCancel, onDelete, disabled }: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      {mode === 'view' ? (
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={onEdit}
            disabled={disabled}
            data-test-id="edit-project"
          >
            Edit Project
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onDelete}
            disabled={disabled}
            data-test-id="delete-project"
          >
            Delete
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={disabled}
            data-test-id="save-project"
          >
            Save
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={disabled}
            data-test-id="cancel-edit"
          >
            Cancel
          </Button>
        </Stack>
      )}
    </Box>
  );
}