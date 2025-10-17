'use client';

import * as React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader(props: UiStepperHeaderProps) {
  const { value, onChange, labels } = props;
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={value}
        onChange={(_e, v: number) => onChange(v)}
        aria-label="endpoint configuration tabs"
        data-test-id={props['data-test-id']}
      >
        {labels.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
    </Box>
  );
}