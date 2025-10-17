'use client';

import { Box, Button } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import type { ActionBarProps } from './types';

export default function ActionBar({ isEditing, isSaving, onEdit, onSave, onCancel }: ActionBarProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {isEditing ? (
        <>
          <LoadingButton
            loading={isSaving}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={onSave}
            data-test-id="save-btn"
          >
            Save
          </LoadingButton>
          <Button
            startIcon={<CancelIcon />}
            variant="outlined"
            onClick={onCancel}
            disabled={isSaving}
            data-test-id="cancel-btn"
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          startIcon={<EditIcon />}
          variant="outlined"
          onClick={onEdit}
          data-test-id="edit-btn"
        >
          Edit
        </Button>
      )}
    </Box>
  );
}