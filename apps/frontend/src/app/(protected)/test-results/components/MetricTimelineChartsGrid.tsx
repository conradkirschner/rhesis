'use client';

import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { TimelineDataItem } from './timelineUtils';

import type { TestResultStatsAll } from '@/api-client/types.gen';

import { generateTestResultStatsTestResultsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

import MetricTimelineChart from './MetricTimelineChart';

interface MetricTimelineChartsGridProps {
    filters: Partial<{ months: number }>;
}

/** ---- Utilities ---- */
const extractUniqueMetrics = (timeline?: ReadonlyArray<TimelineDataItem>): string[] => {
    if (!timeline || timeline.length === 0) return [];
    const names = new Set<string>();
    for (const item of timeline) {
        const m = item.metrics;
        if (m && typeof m === 'object') {
            for (const key of Object.keys(m)) names.add(key);
        }
    }
    return Array.from(names).sort();
};

export default function MetricTimelineChartsGrid({
                                                     filters,
                                                 }: MetricTimelineChartsGridProps) {
    const theme = useTheme();

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
    const timeline = useMemo<TimelineDataItem[]>(() => {
        const t = stats?.timeline;
        return Array.isArray(t) ? (t as TimelineDataItem[]) : [];
    }, [stats?.timeline]);

    const uniqueMetrics = useMemo(() => extractUniqueMetrics(timeline), [timeline]);

    /** ---- Render states ---- */
    if (statsQuery.isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 400,
                    gap: 2,
                }}
            >
                <CircularProgress size={24} />
                <Typography variant="caption">Loading metrics timeline…</Typography>
            </Box>
        );
    }

    if (statsQuery.isError) {
        const msg =statsQuery.error.message;
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {msg}
            </Alert>
        );
    }

    if (timeline.length === 0 || uniqueMetrics.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    No metric timeline data available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Timeline data does not contain metric breakdowns for the selected period.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Individual Metric Performance Over Time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track pass rates for each metric across the selected time period. Found {uniqueMetrics.length} metrics.
            </Typography>

            {/* Responsive grid for metric charts */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr',
                        lg: '1fr 1fr 1fr',
                        xl: '1fr 1fr 1fr 1fr',
                    },
                    gap:
                        (theme).customSpacing?.section?.medium ?? 2,
                }}
            >
                {uniqueMetrics.map((metricName) => (
                    <MetricTimelineChart
                        key={metricName}
                        metricName={metricName}
                        timelineData={timeline}
                    />
                ))}
            </Box>
        </Box>
    );
}
