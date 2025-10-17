'use client';

import * as React from 'react';
import { Box, Step, StepLabel, Stepper } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader({ steps, activeStep }: UiStepperHeaderProps) {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}