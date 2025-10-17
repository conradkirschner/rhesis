'use client';

import * as React from 'react';
import { useTheme, Box } from '@mui/material';
import { BasePieChart, BaseLineChart, BaseChartsGrid } from '@/components/common/BaseCharts';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type { UiDashboardChartsProps } from './types';

export default function DashboardCharts(props: UiDashboardChartsProps) {
    const {
        isLoading,
        errorMessage,
        testCasesData,
        testExecutionTrendData,
        behaviorData,
        categoryData,
    } = props;

    const theme = useTheme();


    // Convert readonly arrays to mutable arrays for chart libs that expect mutable data
    const behaviorDataMutable = React.useMemo(
        () => Array.from(behaviorData ?? []),
        [behaviorData]
    );
    const categoryDataMutable = React.useMemo(
        () => Array.from(categoryData ?? []),
        [categoryData]
    );
    if (isLoading) return <InlineLoader />;
    if (errorMessage) return <ErrorBanner message={errorMessage} />;

    return (
        <Box data-test-id="dashboard-charts">
            <BaseChartsGrid columns={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
                <BaseLineChart
                    title="Cumulative Tests"
                    data={[...testCasesData]}
                    series={[{ dataKey: 'total', name: 'Total Test Cases' }]}
                    useThemeColors
                    colorPalette="line"
                    height={180}
                />

                <BaseLineChart
                    title="Test Execution Trend"
                    data={[...testExecutionTrendData]}
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
                    data={behaviorDataMutable}
                    useThemeColors
                    colorPalette="pie"
                />

                <BasePieChart
                    title="Tests Category Distribution"
                    data={categoryDataMutable}
                    useThemeColors
                    colorPalette="pie"
                />
            </BaseChartsGrid>
        </Box>
    );
}
