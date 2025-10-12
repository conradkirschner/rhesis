'use client';

import * as React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import type { TestResultStatsAll } from '@/api-client/types.gen';

import { generateTestResultStatsTestResultsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface TestResultsSummaryProps {
  // only months is relevant (others can be added if your endpoint supports them)
  filters: Partial<{ months: number }>;
}

// Helper to map pass-rate to icon/colors
function getPassRateDisplay(passRate: number) {
  if (passRate >= 80) {
    return {
      icon: CheckCircleIcon,
      color: 'success.main' as const,
      iconColor: 'success' as const,
    };
  } else if (passRate >= 50) {
    return {
      icon: WarningIcon,
      color: 'warning.main' as const,
      iconColor: 'warning' as const,
    };
  } else {
    return {
      icon: CancelIcon,
      color: 'error.main' as const,
      iconColor: 'error' as const,
    };
  }
}

// Narrow local type for the piece of summary we need (avoid depending on utils/)
type RunSummary = {
  id?: string;
  name?: string | null;
  created_at?: string | null;
  total_tests?: number | null;
  overall?: {
    passed?: number | null;
    failed?: number | null;
    pass_rate?: number | null;
    total?: number | null;
  } | null;
};

export default function TestResultsSummary({
                                             filters,
                                           }: TestResultsSummaryProps) {
  const theme = useTheme();

  // Gentle fallbacks for custom theme tokens
  const sectionMedium = theme.customSpacing?.section?.medium ?? 2;
  const containerMedium = theme.customSpacing?.container?.medium ?? 2;
  const elevation = theme.elevation?.standard ?? 1;
  const iconLg = theme.iconSizes?.large ?? 28;

  // Build query params for the "all" mode summary
  const queryParams = React.useMemo(
      () => ({
        mode: 'all' as const,
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

  /** ---- Render states ---- */
  if (statsQuery.isLoading) {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
    );
  }

  if (statsQuery.isError) {
    const msg =  statsQuery.error.message;
    return <Alert severity="error" sx={{ mt: sectionMedium }}>{msg}</Alert>;
  }

  const data = statsQuery.data as TestResultStatsAll | undefined;

  if (!data) {
    return <Alert severity="info" sx={{ mt: sectionMedium }}>No summary data available.</Alert>;
  }

  const test_run_summary = data.test_run_summary as unknown as RunSummary[] | undefined;
  const metadata = data.metadata as {
    total_test_runs?: number | null;
    total_test_results?: number | null;
    period?: string | null;
  };

  // Aggregate totals
  const totalTests =
      test_run_summary?.reduce((sum, run) => sum + (run.total_tests ?? 0), 0) ?? 0;
  const totalPassed =
      test_run_summary?.reduce((sum, run) => sum + (run.overall?.passed ?? 0), 0) ?? 0;
  const totalFailed =
      test_run_summary?.reduce((sum, run) => sum + (run.overall?.failed ?? 0), 0) ?? 0;
  const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  const passRateDisplay = getPassRateDisplay(overallPassRate);

  // Most recent 5 runs (by created_at)
  const recentTestRuns: RunSummary[] =
      (test_run_summary ?? [])
          .filter((r) => r.created_at)
          .sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
          })
          .slice(0, 5);

  return (
      <Box>
        {/* Overall Statistics Cards */}
        <Grid container spacing={sectionMedium} sx={{ mb: sectionMedium }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={elevation} sx={{ height: '100%', minHeight: 120 }}>
              <CardContent
                  sx={{ height: '100%', display: 'flex', alignItems: 'center', p: containerMedium }}
              >
                <Box display="flex" alignItems="center" gap={containerMedium}>
                  <AnalyticsIcon color="primary" sx={{ fontSize: iconLg }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {metadata?.total_test_runs ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Test Runs
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={elevation} sx={{ height: '100%', minHeight: 120 }}>
              <CardContent
                  sx={{ height: '100%', display: 'flex', alignItems: 'center', p: containerMedium }}
              >
                <Box display="flex" alignItems="center" gap={containerMedium}>
                  <AssessmentIcon color="primary" sx={{ fontSize: iconLg }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {metadata?.total_test_results ?? totalTests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Test Results
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={elevation} sx={{ height: '100%', minHeight: 120 }}>
              <CardContent
                  sx={{ height: '100%', display: 'flex', alignItems: 'center', p: containerMedium }}
              >
                <Box display="flex" alignItems="center" gap={containerMedium}>
                  {React.createElement(passRateDisplay.icon, {
                    color: passRateDisplay.iconColor,
                    sx: { fontSize: iconLg },
                  })}
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color={passRateDisplay.color}>
                      {overallPassRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Pass Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={elevation} sx={{ height: '100%', minHeight: 120 }}>
              <CardContent
                  sx={{ height: '100%', display: 'flex', alignItems: 'center', p: containerMedium }}
              >
                <Box display="flex" alignItems="center" gap={containerMedium}>
                  <ScheduleIcon color="primary" sx={{ fontSize: iconLg }} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {metadata?.period ?? `Last ${filters.months ?? 6} months`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reporting Period
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Test Runs */}
        {recentTestRuns.length > 0 && (
            <Paper elevation={elevation} sx={{ p: containerMedium, mb: sectionMedium }}>
              <Typography variant="h6" gutterBottom>
                Latest Test Runs ({recentTestRuns.length})
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: sectionMedium }}>
                {recentTestRuns.map((run, idx) => (
                    <Box
                        key={run.id ?? idx}
                        sx={{
                          p: 1.25,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: (t) => t.shape.borderRadius * 0.25,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            borderColor: 'primary.main',
                            transform: 'translateY(-1px)',
                            boxShadow: (t) => t.shadows[2],
                          },
                        }}
                        onClick={() => {
                          if (run.id) window.open(`/test-runs/${run.id}`, '_blank');
                        }}
                    >
                      <Box display="flex" alignItems="center" gap={1.25} mb={1}>
                        <Chip label={run.name ?? `Run ${idx + 1}`} variant="outlined" size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {run.created_at ? new Date(run.created_at).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>

                      <Grid container spacing={1.25}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Total Tests
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {run.total_tests ?? run.overall?.total ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Passed
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="success.main">
                            {run.overall?.passed ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Failed
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="error.main">
                            {run.overall?.failed ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Pass Rate
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {run.overall?.pass_rate != null
                                ? run.overall.pass_rate.toFixed(1)
                                : '0.0'}
                            %
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                ))}
              </Box>
            </Paper>
        )}
      </Box>
  );
}
