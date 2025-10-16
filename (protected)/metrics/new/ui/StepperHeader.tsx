import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

type Props = {
  readonly steps: readonly string[];
  readonly activeStep: number;
};

export default function StepperHeader({ steps, activeStep }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, mt: 4 }}>
      <Box sx={{ maxWidth: '600px', width: '100%' }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Box>
  );
}