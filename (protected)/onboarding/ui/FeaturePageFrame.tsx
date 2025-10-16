import * as React from 'react';
import { Container, Box, Paper, Stepper, Step, StepLabel, Typography } from '@mui/material';
import type { UiFeaturePageFrameProps } from './types';

export default function FeaturePageFrame(props: UiFeaturePageFrameProps) {
  const { title, subtitle, steps, activeStep, children } = props;
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        <Box mb={4}>
          <Paper variant="outlined" elevation={0}>
            <Box p={3}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Paper>
        </Box>

        <Box>{children}</Box>
      </Box>
    </Container>
  );
}