'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import BaseTimelineChart from './BaseTimelineChart';
import { extractOverallData, type TimelineDataItem } from './timelineUtils';

import type { TestResultStatsAll } from '@/api-client/types.gen';

import { generateTestResultStatsTestResultsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface PassRateTimelineChartProps {
  filters: Partial<{ months: number }>;
}

export default function PassRateTimelineChart({
                                                filters,
                                              }: PassRateTimelineChartProps) {
  const queryParams = useMemo(
      () => ({
        mode: 'timeline' as const,
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

  const timeline = stats?.timeline;

  const errorMessage =
      statsQuery.isError
          ? (statsQuery.error.message)
          : null;

  if (!timeline){
      return <div>add loading</div>
  }
  return (
      <BaseTimelineChart
          title="Pass Rate by Month"
          data={timeline}
          dataExtractor={extractOverallData}
          height={400}
          contextInfo="Monthly pass rate trends showing test performance over time"
          showMockDataFallback={true}
          isLoading={statsQuery.isLoading}
          error={errorMessage}
      />
  );
}
