import { Box, Typography } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader({ title, subtitle }: UiStepperHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}