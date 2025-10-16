'use client';

import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { BasePieChart } from '@/components/common/BaseCharts';

import type { TestResultStatsAll } from '@/api-client/types.gen';

import { generateTestResultStatsTestResultsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface LatestResultsPieChartProps {
  filters: Partial<{ months: number }>;
}

// Inline pass/fail entry shape (schema doesn’t export a dedicated type)
type PassFailEntry = { passed?: number | null; failed?: number | null };

const transformPassFailToChartData = (stats?: PassFailEntry) => {
  if (!stats) return [{ name: 'No Data', value: 1 }];

  const passed = stats.passed ?? 0;
  const failed = stats.failed ?? 0;

  if (passed === 0 && failed === 0) {
    return [{ name: 'No Data', value: 1 }];
  }

  return [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: failed },
  ].filter((d) => d.value > 0);
};

export default function LatestResultsPieChart({
                                                filters,
                                              }: LatestResultsPieChartProps) {
  const theme = useTheme();

  const queryParams = useMemo(
      () => ({
        mode: 'summary' as const, // API enum value
        months: filters.months ?? 6,
      }),
      [filters.months],
  );

  const statsQuery = useQuery({
    ...generateTestResultStatsTestResultsStatsGetOptions({
      query: queryParams,
    }),
    staleTime: 60_000,
  });

  const stats = statsQuery.data as TestResultStatsAll | undefined;

  const latestRunData = useMemo(() => {
    const data = transformPassFailToChartData(
        stats?.overall_pass_rates as PassFailEntry | undefined,
    );
    // Guard against any NaN values
    return data.map((item) => ({
      ...item,
      value: Number.isNaN(item.value) ? 0 : item.value,
    }));
  }, [stats?.overall_pass_rates]);

  const heading = stats?.metadata?.test_run_id ? 'Test Run Results' : 'Overall Results';
  const subheading = 'Distribution of passed and failed tests in the selected period';

  if (statsQuery.isLoading) {
    return (
        <Paper
            elevation={theme.elevation?.standard ?? 1}
            sx={{
              p: theme.customSpacing?.container?.medium ?? 2,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
            }}
        >
          <Typography variant="h6" sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}>
            Overall Results
          </Typography>
          <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}
          >
            {subheading}
          </Typography>
          <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                gap: 1.5,
              }}
          >
            <CircularProgress size={24} />
            <Typography variant="caption">Loading results…</Typography>
          </Box>
        </Paper>
    );
  }

  if (statsQuery.isError) {
    const msg =
        statsQuery.error instanceof Error
            ? statsQuery.error.message
            : 'Failed to load summary data';
    return (
        <Paper
            elevation={theme.elevation?.standard ?? 1}
            sx={{
              p: theme.customSpacing?.container?.medium ?? 2,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
            }}
        >
          <Typography variant="h6" sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}>
            Overall Results
          </Typography>
          <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}
          >
            Error occurred
          </Typography>
          <Alert severity="error">{msg}</Alert>
        </Paper>
    );
  }

  return (
      <Paper
          elevation={theme.elevation?.standard ?? 1}
          sx={{
            p: theme.customSpacing?.container?.medium ?? 2,
            height: 400,
            display: 'flex',
            flexDirection: 'column',
          }}
      >
        <Typography variant="h6" sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}>
          {heading}
        </Typography>
        <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: theme.customSpacing?.section?.small ?? 1.5,
              minHeight: '2.5rem',
              display: 'flex',
              alignItems: 'flex-start',
            }}
        >
          {subheading}
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <BasePieChart
              title=""
              data={latestRunData}
              useThemeColors
              colorPalette="pie"
              height={300}
              innerRadius={40}
              outerRadius={90}
              showPercentage
              elevation={0}
              preventLegendOverflow
              variant="test-results"
              legendProps={{
                wrapperStyle: {
                  fontSize: theme.typography.chartTick?.fontSize ?? theme.typography.caption.fontSize,
                  marginTop: theme.spacing(1.875),
                  marginBottom: theme.spacing(1.25),
                  paddingBottom: theme.spacing(1.25),
                },
                iconSize: 8,
                layout: 'horizontal',
                verticalAlign: 'bottom',
                align: 'center',
              }}
          />
        </Box>
      </Paper>
  );
}
