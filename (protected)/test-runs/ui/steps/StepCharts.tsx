'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { BasePieChart, BaseChartsGrid } from '@/components/common/BaseCharts';
import type { UiChartsProps } from '../types';

type Props = {
  readonly data: UiChartsProps;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
};

export default function StepCharts({ data, isLoading, errorMessage }: Props) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{errorMessage}</Typography>
      </Box>
    );
  }

  return (
    <BaseChartsGrid>
      <BasePieChart title="Test Runs by Status" data={data.status} useThemeColors colorPalette="pie" />
      <BasePieChart title="Test Runs by Result" data={data.results} useThemeColors colorPalette="pie" />
      <BasePieChart title="Most Run Test Sets" data={data.testSets} useThemeColors colorPalette="pie" />
      <BasePieChart title="Top Test Executors" data={data.executors} useThemeColors colorPalette="pie" />
    </BaseChartsGrid>
  );
}