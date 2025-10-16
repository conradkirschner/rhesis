import { Box, Button } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({
  primaryLabel,
  onPrimary,
  disabled,
  loading,
  'data-test-id': dataTestId,
}: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <Button
        variant="contained"
        size="large"
        onClick={onPrimary}
        disabled={disabled || loading}
        data-test-id={dataTestId ?? 'action-bar-primary'}
        sx={{ minWidth: 220, py: 1.5, px: 3 }}
      >
        {primaryLabel}
      </Button>
    </Box>
  );
}