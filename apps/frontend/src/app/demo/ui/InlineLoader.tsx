import { Box, CircularProgress } from '@mui/material';

export default function InlineLoader() {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={20} />
    </Box>
  );
}