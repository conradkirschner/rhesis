'use client';

import { Stepper, Step, StepLabel } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export function StepperHeader({ activeStep, labels }: UiStepperHeaderProps) {
  return (
    <Stepper activeStep={activeStep} sx={{ py: 4 }} data-test-id="stepper-header">
      {labels.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}