'use client';

import { Box, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

export function StepperHeader({ icon, title }: { icon: 'info' | 'assessment' | 'settings'; title: string }) {
  const Icon =
    icon === 'info' ? InfoIcon : icon === 'assessment' ? AssessmentIcon : SettingsIcon;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
        <Icon fontSize="small" />
      </Box>
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
}