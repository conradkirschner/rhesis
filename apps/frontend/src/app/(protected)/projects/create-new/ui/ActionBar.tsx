'use client';

import * as React from 'react';
import { Box, Button } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({
  onCancel,
  onBack,
  onNext,
  onSubmit,
  isBusy,
  nextLabel = 'Next',
  submitLabel = 'Submit',
}: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, width: '100%' }}>
      <Button
        variant="outlined"
        color="inherit"
        onClick={onCancel}
        data-test-id="action-cancel"
      >
        Cancel
      </Button>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {onBack ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onBack}
            disabled={isBusy}
            data-test-id="action-back"
          >
            Back
          </Button>
        ) : null}

        {onNext ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            disabled={isBusy}
            data-test-id="action-next"
          >
            {nextLabel}
          </Button>
        ) : null}

        {onSubmit ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmit}
            disabled={isBusy}
            data-test-id="action-submit"
          >
            {submitLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}