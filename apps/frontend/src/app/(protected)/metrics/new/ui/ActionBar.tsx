import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type Props = {
  readonly isLoadingAction?: boolean;
  readonly canGoBack?: boolean;
  readonly backLabel?: string;
  readonly onBack?: () => void;
  readonly primaryLabel: string;
  readonly primaryDisabled?: boolean;
  readonly onPrimary: () => void;
};

export default function ActionBar({
  isLoadingAction,
  canGoBack = true,
  backLabel = 'Back',
  onBack,
  primaryLabel,
  primaryDisabled,
  onPrimary,
}: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
      {canGoBack && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          type="button"
          disabled={!!isLoadingAction}
          data-test-id="action-back"
        >
          {backLabel}
        </Button>
      )}
      <Button
        variant="contained"
        onClick={onPrimary}
        type="button"
        disabled={!!isLoadingAction || !!primaryDisabled}
        startIcon={isLoadingAction ? <CircularProgress size={20} /> : undefined}
        data-test-id="action-primary"
      >
        {primaryLabel}
      </Button>
    </Box>
  );
}