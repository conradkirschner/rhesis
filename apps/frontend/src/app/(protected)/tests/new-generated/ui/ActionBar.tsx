'use client';

import { Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import type { UiActionBarProps } from './types';

export function ActionBar({
  activeStep,
  canGoBack,
  onBack,
  onNext,
  onFinish,
  isGenerating,
  isFinishing,
  nextDisabled,
}: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }} data-test-id="action-bar">
      {canGoBack && (
        <Button variant="outlined" onClick={onBack} disabled={isGenerating} data-test-id="back-btn">
          Back
        </Button>
      )}

      {activeStep === 3 ? (
        <LoadingButton
          variant="contained"
          onClick={onFinish}
          loading={isFinishing}
          disabled={isFinishing}
          data-test-id="finish-btn"
        >
          Generate Tests
        </LoadingButton>
      ) : (
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!!nextDisabled}
          data-test-id="next-btn"
        >
          Next
        </Button>
      )}
    </Box>
  );
}