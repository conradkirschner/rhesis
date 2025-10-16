'use client';

import { Box, Button } from '@mui/material';

type Props = {
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly disableCreate?: boolean;
};

export default function ActionBar({ onCancel, onSubmit, disableCreate }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          data-test-id="cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          disabled={Boolean(disableCreate)}
          onClick={onSubmit}
          data-test-id="create-endpoint-button"
        >
          Create Endpoint
        </Button>
      </Box>
    </Box>
  );
}