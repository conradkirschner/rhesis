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
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

import type { TestResultStatsAll } from '@/api-client/types.gen';

import { generateTestResultStatsTestResultsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface LatestTestRunsChartProps {
  // We only need months here; keep it simple and typed
  filters: Partial<{ months: number }>;
}

// Minimal shape we use from the API for safe mapping
type TestRunSummaryItemLite = {
  id?: string | null;
  name?: string | null;
  started_at?: string | null;
  overall?: {
    pass_rate?: number | null;
    total?: number | null;
    passed?: number | null;
    failed?: number | null;
  } | null;
};

type ChartPoint = {
  name: string;
  pass_rate: number;
  total: number;
  passed: number;
  failed: number;
  test_run_id?: string | null;
};

const remToPx = (remLike: string | number): number =>
    typeof remLike === 'number' ? remLike : parseFloat(remLike) * 16;

const transformTestRunsData = (
    testRunSummary?: ReadonlyArray<TestRunSummaryItemLite>,
): ChartPoint[] => {
  if (!Array.isArray(testRunSummary) || testRunSummary.length === 0) {
    // Return a single “No data” point so axes render gracefully
    return [{ name: 'No data', pass_rate: 0, total: 0, passed: 0, failed: 0 }];
  }

  // Sort by most-recent started_at, take 5 latest, then oldest→newest for display
  const sorted = [...testRunSummary]
      .sort((a, b) => {
        const aTime = a.started_at ? Date.parse(a.started_at) : 0;
        const bTime = b.started_at ? Date.parse(b.started_at) : 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .reverse();

  return sorted.map((item) => {
    const runName = item.name ?? 'Unnamed Run';
    const passRateRaw = item.overall?.pass_rate ?? 0;
    const passRate = Math.round(passRateRaw * 10) / 10;


    return {
      name: runName,
      pass_rate: Number.isFinite(passRate) ? passRate : 0,
      total: item.overall?.total ?? 0,
      passed: item.overall?.passed ?? 0,
      failed: item.overall?.failed ?? 0,
      test_run_id: item.id ?? undefined,
    };
  });
};

export default function LatestTestRunsChart({
                                              filters,
                                            }: LatestTestRunsChartProps) {
  const theme = useTheme();

  const queryParams = useMemo(
      () => ({
        mode: 'test_runs' as const,
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

  const chartData = useMemo<ChartPoint[]>(
      () => transformTestRunsData(stats?.test_run_summary as TestRunSummaryItemLite[] | undefined),
      [stats?.test_run_summary],
  );

  // Choose a consistent color; fall back to theme primary if custom palette missing
  const passRateColor =
      (theme as unknown as { chartPalettes?: { line?: string[] } })?.chartPalettes?.line?.[0] ??
      theme.palette.primary.main;

  const tickFontSizePx = Math.max(
      8,
      remToPx(theme.typography.caption.fontSize ?? 12),
  );

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
            Latest Test Runs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}>
            Pass rates from the 5 most recent test executions
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
            <Typography variant="caption">Loading test runs…</Typography>
          </Box>
        </Paper>
    );
  }

  if (statsQuery.isError) {
    const msg = statsQuery.error.message;
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
            Latest Test Runs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: theme.customSpacing?.section?.small ?? 1.5 }}>
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
          Latest Test Runs
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
          Pass rates from the 5 most recent test executions
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 5, right: 15, bottom: 35, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                  dataKey="name"
                  type="category"
                  name="Test Run"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{
                    fontSize: tickFontSizePx,
                    fill: theme.palette.text.primary,
                  }}
                  height={60}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={{ strokeWidth: 1 }}
              />
              <YAxis
                  type="number"
                  dataKey="pass_rate"
                  name="Pass Rate"
                  domain={[0, 100]}
                  tickCount={6}
                  tick={{
                    fontSize: tickFontSizePx,
                    fill: theme.palette.text.primary,
                  }}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={{ strokeWidth: 1 }}
                  tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                  contentStyle={{
                    fontSize: String(theme.typography.caption.fontSize ?? 12),
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    color: theme.palette.text.primary,
                  }}
                  formatter={(value: number | string) => {
                    const num = typeof value === 'number' ? value : Number(value);
                    const safe = Number.isFinite(num) ? num : 0;
                    return [`${safe}%`, 'Pass Rate'] as [string, string];
                  }}
                  labelFormatter={(label: string) => label || 'Test Run'}
              />
              {/* With a 'name' on <Scatter />, <Legend /> can render automatically */}
              <Legend
                  wrapperStyle={{
                    fontSize: String(theme.typography.caption.fontSize ?? 12),
                  }}
                  iconSize={8}
                  height={30}
              />
              <Scatter
                  name="Pass Rate"
                  data={chartData}
                  fill={passRateColor}
                  line={false}
                  shape="circle"
                  legendType="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
  );
}
