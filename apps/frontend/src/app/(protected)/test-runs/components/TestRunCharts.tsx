'use client';

import React, { useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BasePieChart, BaseChartsGrid } from '@/components/common/BaseCharts';
import { useQuery } from '@tanstack/react-query';

import type {
    TestRunStatsStatus,
    TestRunStatsResults,
    TestRunStatsTests,
    TestRunStatsExecutors,
} from '@/api-client/types.gen';

import { generateTestRunStatsTestRunsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';


const FALLBACK = [{ name: 'Loading…', value: 100 }];

const CHART_CFG = {
    status: { top: 5, title: 'Test Runs by Status' as const },
    result: { top: 5, title: 'Test Runs by Result' as const },
    test: { top: 5, title: 'Most Run Test Sets' as const },
    executor: { top: 5, title: 'Top Test Executors' as const },
};

const truncate = (s: string) => (s.length <= 15 ? s : `${s.slice(0, 12)}…`);

export default function TestRunCharts() {

    const statusQuery = useQuery({
        ...generateTestRunStatsTestRunsStatsGetOptions({
            query: { mode: 'status', top: CHART_CFG.status.top, months: 6 },
        }),
        staleTime: 60_000,
    });

    const resultQuery = useQuery({
        ...generateTestRunStatsTestRunsStatsGetOptions({
            query: { mode: 'results', top: CHART_CFG.result.top, months: 6 },
        }),
        staleTime: 60_000,
    });

    const testSetsQuery = useQuery({
        ...generateTestRunStatsTestRunsStatsGetOptions({
            query: { mode: 'test_sets', top: CHART_CFG.test.top, months: 6 },
        }),
        staleTime: 60_000,
    });

    const executorsQuery = useQuery({
        ...generateTestRunStatsTestRunsStatsGetOptions({
            query: { mode: 'executors', top: CHART_CFG.executor.top, months: 6 },
        }),
        staleTime: 60_000,
    });

    /* -------- Aggregate loading / error -------- */
    const isLoading =
        statusQuery.isLoading ||
        resultQuery.isLoading ||
        testSetsQuery.isLoading ||
        executorsQuery.isLoading;

    const firstError =
        statusQuery.error || resultQuery.error || testSetsQuery.error || executorsQuery.error;



    /* -------- Data mappers (typed casts at the edge) -------- */
    const statusData = useMemo(() => {
        const data = statusQuery.data as unknown as TestRunStatsStatus | undefined;
        const dist = data?.status_distribution ?? [];
        if (!dist.length) return FALLBACK;
        return dist.slice(0, CHART_CFG.status.top).map((d) => ({
            name: truncate(d.status),
            value: d.count,
            fullName: d.status,
        }));
    }, [statusQuery.data]);

    const resultData = useMemo(() => {
        const data = resultQuery.data as unknown as TestRunStatsResults | undefined;
        const d = data?.result_distribution;
        if (!d) return FALLBACK;
        return [
            { name: 'Passed', value: d.passed, fullName: 'Passed' },
            { name: 'Failed', value: d.failed, fullName: 'Failed' },
            { name: 'Pending', value: d.pending, fullName: 'Pending' },
        ].filter((x) => x.value > 0);
    }, [resultQuery.data]);

    const testSetsData = useMemo(() => {
        const data = testSetsQuery.data as unknown as TestRunStatsTests | undefined;
        const list = data?.most_run_test_sets ?? [];
        if (!list.length) return FALLBACK;
        return list.slice(0, CHART_CFG.test.top).map((d) => ({
            name: truncate(d.test_set_name),
            value: d.run_count,
            fullName: d.test_set_name,
        }));
    }, [testSetsQuery.data]);

    const executorsData = useMemo(() => {
        const data = executorsQuery.data as unknown as TestRunStatsExecutors | undefined;
        const list = data?.top_executors ?? [];
        if (!list.length) return FALLBACK;
        return list.slice(0, CHART_CFG.executor.top).map((d) => ({
            name: truncate(d.executor_name),
            value: d.run_count,
            fullName: d.executor_name,
        }));
    }, [executorsQuery.data]);
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (firstError) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="error">
                    {(firstError as Error)?.message ?? 'Failed to load chart data'}
                </Typography>
            </Box>
        );
    }
    /* -------- Render -------- */
    return (
        <BaseChartsGrid>
            <BasePieChart
                title={CHART_CFG.status.title}
                data={statusData}
                useThemeColors
                colorPalette="pie"
            />
            <BasePieChart
                title={CHART_CFG.result.title}
                data={resultData}
                useThemeColors
                colorPalette="pie"
            />
            <BasePieChart
                title={CHART_CFG.test.title}
                data={testSetsData}
                useThemeColors
                colorPalette="pie"
            />
            <BasePieChart
                title={CHART_CFG.executor.title}
                data={executorsData}
                useThemeColors
                colorPalette="pie"
            />
        </BaseChartsGrid>
    );
}
