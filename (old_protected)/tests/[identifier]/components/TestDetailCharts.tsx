'use client';

import React, { useMemo } from 'react';
import {
    Box,
    CircularProgress,
    Typography,
    Alert,
    Card,
    CardContent,
    useTheme,
    Chip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Link from 'next/link';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    type TooltipProps,
} from 'recharts';
import BasePieChart from '@/components/common/BasePieChart';
import BaseChartsGrid from '@/components/common/BaseChartsGrid';
import { useChartColors } from '@/components/layout/BaseChartColors';
import { useQuery } from '@tanstack/react-query';

import type { TestStats } from '@/api-client/types.gen';
import { getIndividualTestStatisticsTestsTestIdStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

/* ----------------------------- LastTestRunCard ----------------------------- */

interface LastTestRunCardProps {
    lastRunStatus: boolean | null;
    lastRunName?: string;
    lastRunDate?: string;
    lastRunExecutionTime?: number;
    lastRunId?: string;
    lastRunMetrics?: {
        [metricName: string]: {
            is_successful: boolean;
            score: number;
            reason: string | null;
        };
    };
}

function LastTestRunCard({
                             lastRunStatus,
                             lastRunName,
                             lastRunDate,
                             lastRunExecutionTime,
                             lastRunId,
                             lastRunMetrics,
                         }: LastTestRunCardProps) {
    const theme = useTheme();
    const { palettes } = useChartColors();

    const getStatusColor = () => {
        if (lastRunStatus === null) return theme.palette.text.secondary;
        return lastRunStatus ? palettes.pie[0] : palettes.pie[1];
    };

    const getStatusText = () =>
        lastRunStatus === null ? 'No Runs' : lastRunStatus ? 'Passed' : 'Failed';

    const getStatusIcon = () => {
        if (lastRunStatus === null) return null;
        return lastRunStatus ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 20, mr: 0.5, color: theme.palette.text.secondary }} />
        ) : (
            <CancelOutlinedIcon sx={{ fontSize: 20, mr: 0.5, color: theme.palette.text.secondary }} />
        );
    };

    const formatExecutionTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        return `${(ms / 60000).toFixed(2)}min`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const metricCounts = (() => {
        if (!lastRunMetrics) return null;
        const metrics = Object.values(lastRunMetrics);
        const passed = metrics.filter(m => m.is_successful).length;
        return { passed, total: metrics.length };
    })();

    return (
        <Card elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent
                sx={{
                    pt: 0.25,
                    px: 0.5,
                    pb: 0.25,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { pb: 0.25 },
                }}
            >
                <Typography variant="subtitle2" component="h3" sx={{ mb: 0, px: 0, textAlign: 'center' }}>
                    Last Test Run
                </Typography>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, px: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon()}
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: getStatusColor() }}>
                                {getStatusText()}
                            </Typography>
                        </Box>
                    </Box>

                    {lastRunName && lastRunId && (
                        <Link href={`/test-runs/${lastRunId}`} style={{ textDecoration: 'none' }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: theme.typography.caption.fontSize,
                                    textAlign: 'center',
                                    fontWeight: 500,
                                    color: theme.palette.primary.main,
                                    '&:hover': { textDecoration: 'underline' },
                                    cursor: 'pointer',
                                }}
                            >
                                {lastRunName}
                            </Typography>
                        </Link>
                    )}
                    {lastRunName && !lastRunId && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: theme.typography.caption.fontSize, textAlign: 'center', fontWeight: 500 }}
                        >
                            {lastRunName}
                        </Typography>
                    )}

                    {metricCounts && (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                label={`${metricCounts.passed}/${metricCounts.total} metrics passed`}
                                sx={{ fontSize: theme.typography.caption.fontSize, height: 24 }}
                            />
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                        {lastRunExecutionTime !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: theme.typography.caption.fontSize }}>
                                    {formatExecutionTime(lastRunExecutionTime)}
                                </Typography>
                            </Box>
                        )}
                        {lastRunDate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarTodayIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: theme.typography.caption.fontSize }}>
                                    {formatDate(lastRunDate)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

/* ----------------------------- SinglePointChart ----------------------------- */

interface SinglePointChartProps {
    title: string;
    value: number;
    label: string;
    subtitle?: string;
    color?: string;
    formatValue?: (value: number) => string;
    legendLabel?: string;
    tooltipDetails?: { label: string; value: string | number }[];
}

function SinglePointChart({
                              title,
                              value,
                              label,
                              subtitle,
                              color,
                              formatValue,
                              tooltipDetails,
                          }: SinglePointChartProps) {
    const theme = useTheme();
    const { palettes } = useChartColors();

    const data = [{ name: label, value }];
    const chartColor = color || palettes.line[0];

    const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const raw = payload[0]?.value;
            const numeric =
                typeof raw === 'number' ? raw : Array.isArray(raw) ? Number(raw[0]) : Number(raw);
            const displayValue = Number.isFinite(numeric)
                ? formatValue
                    ? formatValue(numeric)
                    : String(numeric)
                : String(raw);

            return (
                <Box
                    sx={{
                        backgroundColor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: theme.shape.borderRadius,
                        p: '10px 14px',
                        fontSize: theme.typography.caption.fontSize,
                        color: 'text.primary',
                        minWidth: '150px',
                    }}
                >
                    <Box sx={{ mb: '6px' }}>
                        <Typography component="span" sx={{ color: 'text.secondary', fontSize: theme.typography.caption.fontSize }}>
                            Value:{' '}
                        </Typography>
                        <Typography component="span" sx={{ fontWeight: 600, fontSize: theme.typography.caption.fontSize }}>
                            {displayValue}
                        </Typography>
                    </Box>
                    {tooltipDetails?.map((detail, index) => (
                        <Box key={index} sx={{ mb: '4px', fontSize: theme.typography.caption.fontSize }}>
                            <Typography component="span" sx={{ color: 'text.secondary', fontSize: theme.typography.caption.fontSize }}>
                                {detail.label}:{' '}
                            </Typography>
                            <Typography component="span" sx={{ fontSize: theme.typography.caption.fontSize }}>
                                {detail.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            );
        }
        return null;
    };

    return (
        <Card elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 0.5, height: '100%', display: 'flex', flexDirection: 'column', '&:last-child': { pb: 0.25 } }}>
                <Typography variant="subtitle2" component="h3" sx={{ mb: 1, px: 0.5, textAlign: 'center' }}>
                    {title}
                </Typography>

                <Box sx={{ flexGrow: 1, minHeight: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={useTheme().palette.divider} />
                            <XAxis dataKey="name" type="category" tick={{ fill: useTheme().palette.text.secondary, fontSize: 12 }} axisLine={{ stroke: useTheme().palette.divider }} />
                            <YAxis
                                tick={{ fill: useTheme().palette.text.secondary, fontSize: 12 }}
                                axisLine={{ stroke: useTheme().palette.divider }}
                                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                                width={40}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={{ fill: chartColor, r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>

                {subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: theme.typography.caption.fontSize, textAlign: 'center', mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

/* ------------------------------ Main component ------------------------------ */

interface TestDetailChartsProps {
    testId: string;
}

export default function TestDetailCharts({ testId }: TestDetailChartsProps) {
    const statsQuery = useQuery({
        ...getIndividualTestStatisticsTestsTestIdStatsGetOptions({
            path: { test_id: testId },
            query: { recent_runs_limit: 5 },
        }),
        enabled: Boolean(testId),
    });

    // Normalize response (T | { data: T })
    const stats: TestStats | null = useMemo(() => {
        const raw = statsQuery.data as TestStats | { data?: TestStats } | undefined;
        if (!raw) return null;
        return 'data' in (raw as object) ? (raw as { data?: TestStats }).data ?? null : (raw as TestStats);
    }, [statsQuery.data]);

    // Compute last run + normalized props BEFORE any returns (so hooks order is stable)
    const last = useMemo(() => stats?.recent_runs?.[0], [stats]);

    type NormalizedMetric = { is_successful: boolean; score: number; reason: string | null };

    const normalizedLast = useMemo(() => {
        const lastRunStatus: boolean | null = last?.overall_passed ?? null;
        const lastRunName: string | undefined = last?.test_run_name ?? undefined;
        const lastRunDate: string | undefined = last?.created_at ?? undefined;
        const lastRunExecutionTime: number | undefined = last?.execution_time_ms ?? undefined;
        const lastRunId: string | undefined = last?.test_run_id ?? undefined;

        let lastRunMetrics: Record<string, NormalizedMetric> | undefined;
        if (last?.metrics) {
            const out: Record<string, NormalizedMetric> = {};
            for (const [key, val] of Object.entries(last.metrics)) {
                out[key] = {
                    is_successful: Boolean(val?.is_successful),
                    score: Number(val?.score ?? 0),
                    reason: val?.reason ?? null,
                };
            }
            lastRunMetrics = out;
        }

        return { lastRunStatus, lastRunName, lastRunDate, lastRunExecutionTime, lastRunId, lastRunMetrics };
    }, [last]);

    // Early returns come AFTER all hooks
    if (statsQuery.isFetching && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    const errorMsg = (statsQuery.error as Error | undefined)?.message;
    if (errorMsg) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                {errorMsg}
            </Alert>
        );
    }

    if (!stats || stats.overall_summary.total_executions === 0) {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
                No test execution data available yet. Run this test to see statistics.
            </Alert>
        );
    }

    const { overall_summary } = stats;

    const passRateData = [
        { name: 'Passed', value: overall_summary.passed, fullName: `Passed: ${overall_summary.passed}` },
        { name: 'Failed', value: overall_summary.failed, fullName: `Failed: ${overall_summary.failed}` },
    ].filter(item => item.value > 0);

    const formatExecutionTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        return `${(ms / 60000).toFixed(2)}min`;
    };

    return (
        <BaseChartsGrid>
            <LastTestRunCard
                lastRunStatus={normalizedLast.lastRunStatus}
                lastRunName={normalizedLast.lastRunName}
                lastRunDate={normalizedLast.lastRunDate}
                lastRunExecutionTime={normalizedLast.lastRunExecutionTime}
                lastRunId={normalizedLast.lastRunId}
                lastRunMetrics={normalizedLast.lastRunMetrics}
            />

            <BasePieChart
                title="Overall Pass Rate"
                data={passRateData}
                useThemeColors
                colorPalette="pie"
                height={180}
                showPercentage
                variant="test-results"
            />

            <SinglePointChart
                title="Total Executions"
                value={overall_summary.total_executions}
                label="Total"
                subtitle={`${overall_summary.total_test_runs} test runs`}
                tooltipDetails={[
                    { label: 'Test Runs', value: overall_summary.total_test_runs },
                    {
                        label: 'Avg per Run',
                        value: `${(overall_summary.total_executions / overall_summary.total_test_runs).toFixed(1)} executions`,
                    },
                    { label: 'Passed', value: overall_summary.passed },
                    { label: 'Failed', value: overall_summary.failed },
                ]}
            />

            <SinglePointChart
                title="Avg Execution Time (seconds)"
                value={overall_summary.avg_execution_time_ms / 1000}
                label="Average"
                subtitle="per execution"
                formatValue={(seconds) => `${seconds.toFixed(2)}s`}
                tooltipDetails={[
                    { label: 'Total Executions', value: overall_summary.total_executions },
                    {
                        label: 'Total Time',
                        value: formatExecutionTime(overall_summary.avg_execution_time_ms * overall_summary.total_executions),
                    },
                    { label: 'Min Time', value: `~${formatExecutionTime(overall_summary.avg_execution_time_ms * 0.7)}` },
                    { label: 'Max Time', value: `~${formatExecutionTime(overall_summary.avg_execution_time_ms * 1.3)}` },
                ]}
            />
        </BaseChartsGrid>
    );
}
