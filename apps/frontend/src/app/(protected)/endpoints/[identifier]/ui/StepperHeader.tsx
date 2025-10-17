'use client';

import { Tabs, Tab } from '@mui/material';
import type { StepKey, StepperHeaderProps } from './types';

const STEP_LABELS: Record<StepKey, string> = {
  basic: 'Basic Information',
  request: 'Request Settings',
  response: 'Response Settings',
  test: 'Test Connection',
};

export default function StepperHeader({ step, onStepChange, steps }: StepperHeaderProps) {
  const value = steps.indexOf(step);

  return (
    <Tabs
      value={value}
      onChange={(_e, idx) => onStepChange(steps[idx])}
      aria-label="endpoint steps"
      data-test-id="steps-tabs"
    >
      {steps.map((k) => (
        <Tab key={k} label={STEP_LABELS[k]} data-test-id={`tab-${k}`} />
      ))}
    </Tabs>
  );
}