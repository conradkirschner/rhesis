'use client';

import React, { useMemo } from 'react';
import {
  BasePieChart,
  BaseLineChart,
  BaseChartsGrid,
} from '@/components/common/BaseCharts';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import {keepPreviousData, useQuery} from '@tanstack/react-query';

import type { EntityStats } from '@/api-client/types.gen';

import { generateTestSetStatsTestSetsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

/* ------------------------------ fallbacks/config ------------------------------ */

const FALLBACK_DATA = {
  noData: [
    { name: 'No Data Available', value: 100, fullName: 'No Data Available' },
  ],
  total: [{ name: 'Current', count: 0 }],
};

const CHART_CONFIG = {
  status: { top: 5, title: 'Test Sets by Status' },
  creator: { top: 5, title: 'Test Sets by Creator' },
  topics: { top: 5, title: 'Top 5 Topics' },
  total: { title: 'Total Test Sets', months: 6 },
};

/* --------------------------------- helpers ---------------------------------- */

const truncateName = (name: string): string => {
  if (name.length <= 15) return name;
  return `${name.substring(0, 12)}...`;
};

const calculateYAxisDomain = (data: { count: number }[]): [number, number] => {
  if (!data.length) return [0, 100];
  const maxValue = Math.max(...data.map((item) => item.count));
  const multiplier =
      maxValue <= 10 ? 2 : maxValue <= 100 ? 1.5 : maxValue <= 1000 ? 1.2 : 1.1;
  const upperBound = Math.ceil((maxValue * multiplier) / 100) * 100;
  return [0, upperBound];
};

/* -------------------------------- component --------------------------------- */

export default function TestSetsCharts() {
  const theme = useTheme();

  const maxTop = Math.max(CHART_CONFIG.status.top, CHART_CONFIG.creator.top);

  // Overall entity stats
  const entityStatsQuery = useQuery({
    ...generateTestSetStatsTestSetsStatsGetOptions(
        {
          query: {
            top: maxTop,
            months: CHART_CONFIG.total.months,
            mode: 'entity',
          },
        },
    ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  // Topics stats (related entity)
  const topicsStatsQuery = useQuery({
    ...generateTestSetStatsTestSetsStatsGetOptions(
        {
          query: {
            top: CHART_CONFIG.topics.top,
            months: 1,
            mode: 'related_entity',
          },
        },
    ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  // Normalize response shapes (T vs {data:T})
  const testSetStats: EntityStats | null = useMemo(() => {
    const raw = entityStatsQuery.data as EntityStats | { data?: EntityStats } | undefined;
    if (!raw) return null;
    return 'data' in (raw as object)
        ? (raw as { data?: EntityStats }).data ?? null
        : (raw as EntityStats);
  }, [entityStatsQuery.data]);

  const topicsStats: EntityStats | null = useMemo(() => {
    const raw = topicsStatsQuery.data as EntityStats | { data?: EntityStats } | undefined;
    if (!raw) return null;
    return 'data' in (raw as object)
        ? (raw as { data?: EntityStats }).data ?? null
        : (raw as EntityStats);
  }, [topicsStatsQuery.data]);

  const isLoading =
      (entityStatsQuery.isFetching && !entityStatsQuery.data) ||
      (topicsStatsQuery.isFetching && !topicsStatsQuery.data);

  const errorText =
      (entityStatsQuery.error as Error | undefined)?.message ??
      (topicsStatsQuery.error as Error | undefined)?.message ??
      null;

  /* ---------------------------- data transformations --------------------------- */

  const lineChartData = useMemo(() => {
    if (!testSetStats) return FALLBACK_DATA.total;

    if (testSetStats.history?.monthly_counts) {
      return Object.entries(testSetStats.history.monthly_counts).map(
          ([month, count]) => {
            const [year, monthNum] = month.split('-');
            const monthNames = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];
            const idx = Number.parseInt(monthNum ?? '', 10);
            const formatted =
                Number.isFinite(idx) && idx >= 1 && idx <= 12
                    ? `${monthNames[idx - 1]} ${year}`
                    : month;
            return { name: formatted, count: (count as number) ?? 0 };
          },
      );
    }

    return [{ name: 'Current', count: testSetStats.total ?? 0 }];
  }, [testSetStats]);

  const yAxisDomain = useMemo(
      () => calculateYAxisDomain(lineChartData),
      [lineChartData],
  );

  const statusData = useMemo(() => {
    const s = testSetStats?.stats?.status;
    if (!s?.breakdown) return FALLBACK_DATA.noData;

    return Object.entries(s.breakdown)
        .map(([name, value]) => ({
          name,
          value: (value as number) ?? 0,
          fullName: name,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, CHART_CONFIG.status.top);
  }, [testSetStats]);

  const creatorData = useMemo(() => {
    const org = testSetStats?.stats?.organization;
    if (!org?.breakdown) return FALLBACK_DATA.noData;

    return Object.entries(org.breakdown)
        .map(([name, value]) => ({
          name: truncateName(name),
          value: (value as number) ?? 0,
          fullName: name,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, CHART_CONFIG.creator.top);
  }, [testSetStats]);

  const topicsData = useMemo(() => {
    const t = topicsStats?.stats?.topic;
    if (!t?.breakdown) return FALLBACK_DATA.noData;

    return Object.entries(t.breakdown)
        .map(([name, value]) => ({
          name: truncateName(name),
          value: (value as number) ?? 0,
          fullName: name,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, CHART_CONFIG.topics.top);
  }, [topicsStats]);

  /* --------------------------------- render ---------------------------------- */

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
          <Typography color="error">{errorText}</Typography>
        </Box>
    );
  }

  return (
      <BaseChartsGrid>
        <BaseLineChart
            title={CHART_CONFIG.total.title}
            data={lineChartData}
            series={[
              {
                dataKey: 'count',
                name: 'Test Sets',
                strokeWidth: 2,
              },
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

        <BasePieChart
            title={CHART_CONFIG.status.title}
            data={statusData}
            useThemeColors
            colorPalette="pie"
            height={180}
        />

        <BasePieChart
            title={CHART_CONFIG.creator.title}
            data={creatorData}
            useThemeColors
            colorPalette="pie"
            height={180}
            showPercentage
        />

        <BasePieChart
            title={CHART_CONFIG.topics.title}
            data={topicsData}
            useThemeColors
            colorPalette="pie"
            height={180}
            showPercentage
        />
      </BaseChartsGrid>
  );
}
