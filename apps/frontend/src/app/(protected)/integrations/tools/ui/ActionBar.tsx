import { Box, Button } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({
  primaryLabel,
  onPrimaryClick,
  primaryDisabled = false,
}: UiActionBarProps) {
  return (
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        data-test-id="primary-action"
      >
        {primaryLabel}
      </Button>
    </Box>
  );
}