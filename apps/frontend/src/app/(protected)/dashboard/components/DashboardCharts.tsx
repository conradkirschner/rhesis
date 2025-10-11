'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BasePieChart,
  BaseLineChart,
  BaseChartsGrid,
} from '@/components/common/BaseCharts';
import { useTheme, Box, CircularProgress, Alert } from '@mui/material';
import { chartUtils } from '@/components/common/BaseLineChart';
import { formatTimelineDate } from '@/app/(protected)/test-results/components/timelineUtils';

import {
  generateTestStatsTestsStatsGetOptions,
  generateTestResultStatsTestResultsStatsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

// Get last 6 months dynamically
const getLastSixMonths = () => chartUtils.getLastNMonths(6);

// Dynamically generated mock data for the last 6 months
const testTrendData = getLastSixMonths();

// Default data for dimension charts with non-zero values to ensure visualization
const dimensionDataBehavior = [
  { name: 'Reliability', value: 1 },
  { name: 'Robustness', value: 1 },
  { name: 'Compliance', value: 1 },
];

const dimensionDataCategory = [
  { name: 'Harmful', value: 1 },
  { name: 'Harmless', value: 1 },
  { name: 'Jailbreak', value: 1 },
];

// Fallback data for test cases managed - will be populated dynamically
const testCasesManagedData = getLastSixMonths();

export default function DashboardCharts() {
  const theme = useTheme();

  // /tests/stats (EntityStats)
  const {
    data: testStats,
    isLoading: isLoadingTestStats,
    error: errorTestStats,
  } = useQuery(
      generateTestStatsTestsStatsGetOptions({
        query: { top: 5, months: 6 },
      })
  );

  // /test_results/stats (TestResultStats* union) — we use mode: 'timeline'
  const {
    data: testResultsStats,
    isLoading: isLoadingResultsStats,
    error: errorResultsStats,
  } = useQuery(
      generateTestResultStatsTestResultsStatsGetOptions({
        query: { mode: 'timeline', months: 6 },
      })
  );

  const isLoading = isLoadingTestStats || isLoadingResultsStats;
  const errorMsg =
      (errorTestStats as Error | undefined)?.message ??
      (errorResultsStats as Error | undefined)?.message ??
      null;

  const categoryData = useMemo(() => {
    const breakdown = testStats?.stats?.category?.breakdown 
    if (!breakdown) return dimensionDataCategory;
    return Object.entries(breakdown)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value);
  }, [testStats]);

  const behaviorData = useMemo(() => {
    const breakdown = testStats?.stats?.behavior?.breakdown
    if (!breakdown) return dimensionDataBehavior;
    return Object.entries(breakdown)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value);
  }, [testStats]);

  const testCasesData = useMemo(() => {
    if (!testStats) return testCasesManagedData;

    const monthlyCounts = testStats?.history?.monthly_counts as
        | Record<string, number>
        | undefined;

    if (monthlyCounts) {
      const monthlyData = chartUtils.createMonthlyData(
          monthlyCounts,
          getLastSixMonths()
      );
      if (monthlyData.length > 0 && typeof (testStats).total === 'number') {
        const last = monthlyData[monthlyData.length - 1];
        if (last.total < (testStats).total) {
          last.total = (testStats).total;
        }
      }
      return monthlyData;
    }

    return [{ name: 'Current Total', total: (testStats).total ?? 0 }];
  }, [testStats]);

  const testExecutionTrendData = useMemo(() => {
    if (!testResultsStats) return [];
    const timeline = ("timeline" in testResultsStats) ? testResultsStats?.timeline: [];


    if (!timeline || timeline.length === 0) return testTrendData;

    return [...timeline]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          name: formatTimelineDate(item.date),
          tests: item.overall?.total ?? 0,
          passed: item.overall?.passed ?? 0,
          failed: item.overall?.failed ?? 0,
          pass_rate: item.overall?.pass_rate ?? 0,
        }));
  }, [testResultsStats]);

  return (
      <>
        {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
        )}

        {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
        )}

        {!isLoading && !errorMsg && (
            <BaseChartsGrid columns={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
              <BaseLineChart
                  title="Cumulative Tests"
                  data={testCasesData}
                  series={[{ dataKey: 'total', name: 'Total Test Cases' }]}
                  useThemeColors
                  colorPalette="line"
                  height={180}
              />

              <BaseLineChart
                  title="Test Execution Trend"
                  data={testExecutionTrendData}
                  series={[
                    { dataKey: 'tests', name: 'Total Tests', color: theme.palette.primary.main },
                    { dataKey: 'passed', name: 'Passed Tests', color: theme.palette.success.main },
                    { dataKey: 'failed', name: 'Failed Tests', color: theme.palette.error.main },
                  ]}
                  useThemeColors={false}
                  colorPalette="line"
                  height={180}
              />

              <BasePieChart
                  title="Tests Behavior Distribution"
                  data={behaviorData}
                  useThemeColors
                  colorPalette="pie"
              />

              <BasePieChart
                  title="Tests Category Distribution"
                  data={categoryData}
                  useThemeColors
                  colorPalette="pie"
              />
            </BaseChartsGrid>
        )}
      </>
  );
}
