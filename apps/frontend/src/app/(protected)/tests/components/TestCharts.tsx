'use client';

import React, { useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BasePieChart, BaseChartsGrid } from '@/components/common/BaseCharts';
import { useQuery } from '@tanstack/react-query';

import { generateTestStatsTestsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

// Fallback mock data in case the API has no data
const FALLBACK_DATA = [{ name: 'No data', value: 100 }];

// Configuration for each chart
const CHART_CONFIG = {
  behavior: { top: 5, title: 'Tests by Behavior' },
  topic: { top: 3, title: 'Tests by Topic' },
  category: { top: 5, title: 'Tests by Category' },
  status: { top: 5, title: 'Tests by Status' },
} as const;

// Helper function to truncate long names for legends
const truncateName = (name: string): string =>
    name.length <= 15 ? name : `${name.substring(0, 12)}...`;

interface TestChartsProps {

}

export default function TestCharts({}: TestChartsProps) {
  const maxTop = Math.max(
      CHART_CONFIG.behavior.top,
      CHART_CONFIG.topic.top,
      CHART_CONFIG.category.top,
      CHART_CONFIG.status.top
  );

  const statsQuery = useQuery(
      generateTestStatsTestsStatsGetOptions({
        query: { top: maxTop, months: 1 },
      })
  );

  // Normalize possible { data: TestStats } or TestStats to a single shape
  const testStats = useMemo(() => {
    return statsQuery.data
  }, [statsQuery.data]);

  if (statsQuery.isFetching && !testStats) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
    );
  }

  if (statsQuery.isError) {
    const msg =
        (statsQuery.error as Error | undefined)?.message ??
        'Failed to load test statistics';
    return (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{msg}</Typography>
        </Box>
    );
  }

  // Chart data generation helpers (defensive to missing buckets)
  const makeBreakdownData = (
      bucket:
          | { breakdown?: Record<string, number> | null }
          | undefined,
      top: number
  ) => {
    if (!bucket?.breakdown) return FALLBACK_DATA;
    return Object.entries(bucket.breakdown)
        .map(([name, value]) => ({
          name: truncateName(name),
          value: Number(value) || 0,
          fullName: name,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, top);
  };

  const behaviorData = makeBreakdownData(testStats?.stats?.behavior, CHART_CONFIG.behavior.top);
  const topicData = makeBreakdownData(testStats?.stats?.topic, CHART_CONFIG.topic.top);
  const categoryData = makeBreakdownData(testStats?.stats?.category, CHART_CONFIG.category.top);
  const statusData = makeBreakdownData(testStats?.stats?.status, CHART_CONFIG.status.top);

  return (
      <BaseChartsGrid>
        <BasePieChart
            title={CHART_CONFIG.behavior.title}
            data={behaviorData}
            useThemeColors
            colorPalette="pie"
        />
        <BasePieChart
            title={CHART_CONFIG.topic.title}
            data={topicData}
            useThemeColors
            colorPalette="pie"
        />
        <BasePieChart
            title={CHART_CONFIG.category.title}
            data={categoryData}
            useThemeColors
            colorPalette="pie"
        />
        <BasePieChart
            title={CHART_CONFIG.status.title}
            data={statusData}
            useThemeColors
            colorPalette="pie"
        />
      </BaseChartsGrid>
  );
}
