'use client';

import * as React from 'react';
import { Box, Button } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({
  onCancel,
  onSubmit,
  submitting,
  disabled,
  submitLabel,
  ...rest
}: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }} data-test-id={rest['data-test-id']}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel} data-test-id="cancel-button">
          Cancel
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={Boolean(disabled) || Boolean(submitting)}
          data-test-id="submit-button"
        >
          {submitLabel ?? 'Submit'}
        </Button>
      </Box>
    </Box>
  );
}