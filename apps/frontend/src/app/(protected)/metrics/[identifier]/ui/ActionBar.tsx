'use client';

import { Button, Stack } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';

export default function ActionBar({
  saving,
  onCancel,
  onConfirm,
}: {
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        color="error"
        startIcon={<CancelIcon />}
        onClick={onCancel}
        disabled={saving}
        data-test-id="cancel-edit"
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<CheckIcon />}
        onClick={onConfirm}
        disabled={saving}
        data-test-id="save-section"
      >
        {saving ? 'Saving…' : 'Save Section'}
      </Button>
    </Stack>
  );
}