'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import ChecklistIcon from '@mui/icons-material/Checklist';

type Props = {
  readonly title: string;
  readonly tabIndex: number;
  readonly onTabChange: (event: React.SyntheticEvent, value: number) => void;
  readonly children: React.ReactNode;
};

export default function FeaturePageFrame({ title, tabIndex, onTabChange, children }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={[{ title, path: '/metrics' }]}>
      <Box sx={{ width: '100%', minHeight: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, bgcolor: 'background.paper' }}>
          <Tabs value={tabIndex} onChange={onTabChange} aria-label="metrics tabs">
            <Tab icon={<ViewQuiltIcon />} iconPosition="start" label="Metrics Directory" data-test-id="metrics-tab-directory" />
            <Tab icon={<ChecklistIcon />} iconPosition="start" label="Selected Metrics" data-test-id="metrics-tab-selected" />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>
      </Box>
    </PageContainer>
  );
}