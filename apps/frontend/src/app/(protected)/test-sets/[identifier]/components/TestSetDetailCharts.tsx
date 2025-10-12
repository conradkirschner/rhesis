'use client';

import { useMemo, useCallback } from 'react';
import {
  BasePieChart,
  BaseLineChart,
  BaseChartsGrid,
} from '@/components/common/BaseCharts';
import {
  Box,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { pieChartUtils } from '@/components/common/BasePieChart';
import { useQuery } from '@tanstack/react-query';

import type { EntityStats } from '@/api-client/types.gen';

import { generateTestSetTestStatsTestSetsTestSetIdentifierStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

// Fallback mock data in case the API fails
const fallbackData = [{ name: 'Loading...', value: 100 }];

// Fallback data for total test sets line chart
const fallbackTotalData = [{ name: 'Current', count: 0 }];

const DEFAULT_TOP = 5;
const DEFAULT_MONTHS = 6;

interface ChartDataItem {
  name: string;
  value: number;
  fullName?: string;
  percentage?: string;
}

interface LineChartDataItem {
  name: string;
  count: number;
}

// Helper function to calculate y-axis domain for line charts
const calculateDomain = (data: LineChartDataItem[]): [number, number] => {
  if (!data.length) return [0, 100];
  const maxValue = Math.max(...data.map(item => item.count));
  const multiplier = maxValue <= 10 ? 2 : maxValue <= 100 ? 1.5 : maxValue <= 1000 ? 1.2 : 1.1;
  const upperBound = Math.ceil((maxValue * multiplier) / 10) * 10;
  return [0, upperBound];
};

// Helper to truncate long names for legends
const truncateName = (name: string): string => {
  return pieChartUtils.truncateName(name);
};

// Helper to generate a title for a dimension
const generateDimensionTitle = (dimension: string): string => {
  return pieChartUtils.generateDimensionTitle(dimension);
};

interface TestSetDetailChartsProps {
  testSetId: string;
  sessionToken: string;
}

export default function TestSetDetailCharts({
                                              testSetId,
                                              sessionToken,
                                            }: TestSetDetailChartsProps) {
  const theme = useTheme();

  const memoizedAllowedDimensions = useMemo(() => ['behavior', 'category', 'topic'], []);

  const statsQuery = useQuery({
    ...generateTestSetTestStatsTestSetsTestSetIdentifierStatsGetOptions(
        {
          path: { test_set_identifier: testSetId },
          query: { top: DEFAULT_TOP, months: DEFAULT_MONTHS, mode: 'related_entity' },
        },
    ),
    enabled: Boolean(testSetId && sessionToken),
  });

  // Normalize response to the concrete type regardless of {data: T} | T
  const testSetStats: EntityStats | null = useMemo(() => {
    const raw = statsQuery.data as EntityStats | { data?: EntityStats } | undefined;
    if (!raw) return null;
    return Array.isArray((raw as { data?: unknown })?.data) ? null : (Array.isArray(raw) ? null : ('data' in (raw as object) ? (raw as { data?: EntityStats }).data ?? null : (raw as EntityStats)));
  }, [statsQuery.data]);

  const isLoading = statsQuery.isFetching && !statsQuery.data;
  const errorText = (statsQuery.error as Error | undefined)?.message ?? null;

  // Generate line chart data for total tests, using history data if available
  const generateTotalTestsLineData = useCallback((): LineChartDataItem[] => {
    if (!testSetStats) return fallbackTotalData;

    if (testSetStats.history && testSetStats.history.monthly_counts) {
      const entries = Object.entries(
          testSetStats.history.monthly_counts as Record<string, number>,
      );
      return entries.map(([month, count]) => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const idx = Number.parseInt(monthNum ?? '', 10);
        const formattedMonth = Number.isFinite(idx) && idx >= 1 && idx <= 12 ? `${monthNames[idx - 1]} ${year}` : month;
        return { name: formattedMonth, count: count};
      });
    }

    return [
      {
        name: 'Current',
        count: testSetStats.total,
      },
    ];
  }, [testSetStats]);

  // Generic function to generate chart data for any dimension
  const generateDimensionData = useCallback(
      (dimension: string): ChartDataItem[] => {
        if (!testSetStats?.stats?.[dimension]?.breakdown || !testSetStats?.stats?.[dimension]?.total) {
          return fallbackData;
        }

        return pieChartUtils.generateDimensionData(
            testSetStats.stats[dimension].breakdown,
            testSetStats.stats[dimension].total,
            DEFAULT_TOP,
            fallbackData,
        );
      },
      [testSetStats],
  );

  // Calculate line chart data & domain
  const lineChartData = useMemo(() => generateTotalTestsLineData(), [generateTotalTestsLineData]);
  const yAxisDomain = useMemo(() => calculateDomain(lineChartData), [lineChartData]);

  // Memoize dimension data for pie charts
  const dimensionChartData = useMemo(() => {
    return memoizedAllowedDimensions.map(dimension => ({
      dimension,
      title: generateDimensionTitle(dimension),
      data: generateDimensionData(dimension),
    }));
  }, [memoizedAllowedDimensions, generateDimensionData]);

  if (isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
    );
  }

  if (errorText) {
    return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{errorText}</Alert>
        </Box>
    );
  }

  return (
      <BaseChartsGrid>
        {/* Total Tests Line Chart */}
        <BaseLineChart
            title="Total Tests"
            data={lineChartData}
            series={[
              { dataKey: 'count', name: 'Tests Count', strokeWidth: 2 },
            ]}
            useThemeColors
            colorPalette="line"
            height={180}
            legendProps={{
              wrapperStyle: { fontSize: theme.typography.chartTick.fontSize },
              iconSize: 8,
              layout: 'horizontal',
            }}
            yAxisConfig={{ domain: yAxisDomain, allowDataOverflow: true }}
        />

        {/* behavior, category, topic */}
        {dimensionChartData.map(({ dimension, title, data }) => (
            <BasePieChart
                key={dimension}
                title={title}
                data={data}
                useThemeColors
                colorPalette="pie"
                height={180}
                showPercentage
                tooltipProps={{
                  contentStyle: {
                    fontSize: theme.typography.chartTick.fontSize,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '4px',
                    color: theme.palette.text.primary,
                  },
                  formatter: (
                      value: number,
                      name: string,
                      item: { payload: { percentage?: string; fullName?: string } },
                  ): [string, string] => {
                    const pct = item.payload.percentage ?? '';
                    const full = item.payload.fullName ? truncateName(item.payload.fullName) : truncateName(name);
                    return [`${value} (${pct})`, full];
                  },
                }}
            />
        ))}
      </BaseChartsGrid>
  );
}
