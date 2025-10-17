import * as React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({
  showBack = true,
  primaryLabel = 'Next',
  primaryAction = 'next',
  isBusy = false,
  onBack,
  onNext,
  onComplete,
}: UiActionBarProps) {
  const handlePrimary = () => {
    if (primaryAction === 'next') onNext?.();
    else onComplete?.();
  };

  return (
    <Box display="flex" justifyContent="space-between" mt={4}>
      {showBack ? (
        <Button onClick={onBack} disabled={isBusy} size="large" data-test-id="action-back">
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={handlePrimary}
        disabled={isBusy}
        startIcon={isBusy ? <CircularProgress size={20} color="inherit" /> : null}
        size="large"
        data-test-id="action-primary"
      >
        {isBusy && primaryAction === 'complete' ? 'Working...' : primaryLabel}
      </Button>
    </Box>
  );
}