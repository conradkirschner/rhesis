import { Box, Typography } from '@mui/material';
import type { UiFeaturePageFrameProps } from './types';

export default function FeaturePageFrame({
  title,
  subtitle,
  children,
}: UiFeaturePageFrameProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary">{subtitle}</Typography>
        ) : null}
      </Box>
      {children}
    </Box>
  );
}