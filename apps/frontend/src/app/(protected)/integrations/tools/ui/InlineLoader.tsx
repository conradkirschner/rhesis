import { Box, CircularProgress, Typography } from '@mui/material';
import type { UiInlineLoaderProps } from './types';

export default function InlineLoader({ message }: UiInlineLoaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={16} />
      {message ? (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}