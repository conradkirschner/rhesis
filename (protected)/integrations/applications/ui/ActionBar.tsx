'use client';

import { Box, Button } from '@mui/material';
import type { UiActionBarProps } from './types';

export default function ActionBar({ primary }: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
      {primary ? (
        <Button
          variant="contained"
          disabled={primary.disabled}
          onClick={primary.onClick}
          data-test-id={primary['data-test-id']}
          sx={{ textTransform: 'none', borderRadius: theme => theme.shape.borderRadius * 1.5 }}
        >
          {primary.label}
        </Button>
      ) : null}
    </Box>
  );
}