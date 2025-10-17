'use client';

import * as React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BasePieChart, BaseChartsGrid } from '@/components/common/BaseCharts';
import type { PieDatum } from '@/hooks/data/Tests/useTestsData';

type Props = {
  readonly behavior: readonly PieDatum[];
  readonly topic: readonly PieDatum[];
  readonly category: readonly PieDatum[];
  readonly status: readonly PieDatum[];
  readonly loading?: boolean;
  readonly error?: string;
};

const truncate = (name: string) => (name.length <= 15 ? name : `${name.slice(0, 12)}...`);

export default function StepSummaryCharts({ behavior, topic, category, status, loading, error }: Props) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const mapData = (d: readonly PieDatum[]) => d.map((x) => ({ name: truncate(x.name), value: x.value }));

  return (
    <BaseChartsGrid>
      <BasePieChart title="Tests by Behavior" data={mapData(behavior)} useThemeColors colorPalette="pie" />
      <BasePieChart title="Tests by Topic" data={mapData(topic)} useThemeColors colorPalette="pie" />
      <BasePieChart title="Tests by Category" data={mapData(category)} useThemeColors colorPalette="pie" />
      <BasePieChart title="Tests by Status" data={mapData(status)} useThemeColors colorPalette="pie" />
    </BaseChartsGrid>
  );
}