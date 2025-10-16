'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

type MetricResult = {
  is_successful?: boolean | null;
  reason?: string | null;
  score?: number | null;
  threshold?: number | null;
};

type TestResultDetailLite = {
  id: string;
  prompt_id?: string | null;
  test_metrics?: {
    metrics?: Record<string, MetricResult> | null;
  } | null;
};

type BehaviorDef = {
  id: string;
  name: string;
  description?: string;
  metrics: Array<{ name: string; description?: string }>;
};

interface TestDetailMetricsTabProps {
  test: TestResultDetailLite;
  behaviors: BehaviorDef[];
}

type MetricSummary = {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
};

export default function TestDetailMetricsTab({
                                               test,
                                               behaviors,
                                             }: TestDetailMetricsTabProps) {
  const theme = useTheme();
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'passed' | 'failed'>('all');

  // Flatten only metrics present on the test into a table-friendly array
  const metricsData = React.useMemo(() => {
    const testMetrics = test.test_metrics?.metrics ?? {};
    const rows: Array<{
      name: string;
      description?: string;
      passed: boolean;
      fullMetricData: MetricResult;
      behaviorName: string;
    }> = [];

    for (const behavior of behaviors) {
      for (const metric of behavior.metrics) {
        const metricResult = testMetrics[metric.name];
        if (metricResult) {
          rows.push({
            name: metric.name,
            description: metric.description,
            passed: Boolean(metricResult.is_successful),
            fullMetricData: metricResult,
            behaviorName: behavior.name,
          });
        }
      }
    }

    return rows;
  }, [test, behaviors]);

  // Filter by status
  const filteredMetrics = React.useMemo(() => {
    if (filterStatus === 'all') return metricsData;
    const wantPassed = filterStatus === 'passed';
    return metricsData.filter(m => m.passed === wantPassed);
  }, [metricsData, filterStatus]);

  // Overall summary
  const summary: MetricSummary = React.useMemo(() => {
    const total = metricsData.length;
    const passed = metricsData.filter(m => m.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    return { total, passed, failed, passRate };
  }, [metricsData]);

  // Best / worst behavior by pass rate
  const behaviorStats = React.useMemo(() => {
    const stats = new Map<string, { passed: number; total: number }>();

    for (const behavior of behaviors) {
      const items = metricsData.filter(m => m.behaviorName === behavior.name);
      if (items.length > 0) {
        const passed = items.filter(m => m.passed).length;
        stats.set(behavior.name, { passed, total: items.length });
      }
    }

    const entries = Array.from(stats.entries()).map(([name, s]) => ({
      name,
      passed: s.passed,
      total: s.total,
      rate: (s.passed / s.total) * 100,
    }));

    entries.sort((a, b) => b.rate - a.rate);

    const hasMultiple = entries.length > 1;
    return {
      best: entries[0],
      worst: hasMultiple ? entries[entries.length - 1] : undefined,
      hasMultipleBehaviors: hasMultiple,
    };
  }, [metricsData, behaviors]);

  const handleFilterChange = (
      _e: React.MouseEvent<HTMLElement>,
      newFilter: 'all' | 'passed' | 'failed' | null
  ) => {
    if (newFilter) setFilterStatus(newFilter);
  };

  return (
      <Box sx={{ p: 3 }}>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={behaviorStats.hasMultipleBehaviors ? 4 : 6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Performance
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {summary.passRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.passed} of {summary.total} metrics passed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {behaviorStats.hasMultipleBehaviors ? (
              <>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Best Behavior
                      </Typography>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {behaviorStats.best?.name ?? 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {behaviorStats.best ? `${behaviorStats.best.rate.toFixed(0)}% pass rate` : 'No data'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Worst Behavior
                      </Typography>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {behaviorStats.worst?.name ?? 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {behaviorStats.worst ? `${behaviorStats.worst.rate.toFixed(0)}% pass rate` : 'No data'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
          ) : (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Behavior
                    </Typography>
                    <Typography variant="h6" fontWeight={600} noWrap>
                      {behaviorStats.best?.name ?? 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {behaviorStats.best ? `${behaviorStats.best.rate.toFixed(0)}% pass rate` : 'No data'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
          )}
        </Grid>

        {/* Filter Toggle */}
        <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Metrics Breakdown
          </Typography>
          <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={handleFilterChange}
              size="small"
              aria-label="metric status filter"
          >
            <ToggleButton value="all" aria-label="all metrics">
              All
            </ToggleButton>
            <ToggleButton value="passed" aria-label="passed metrics">
              Passed
            </ToggleButton>
            <ToggleButton value="failed" aria-label="failed metrics">
              Failed
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Metrics Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="12%">Status</TableCell>
                <TableCell width="18%">Behavior</TableCell>
                <TableCell width="25%">Metric</TableCell>
                <TableCell width="45%">Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No metrics found
                      </Typography>
                    </TableCell>
                  </TableRow>
              ) : (
                  filteredMetrics.map((metric, idx) => (
                      <TableRow
                          key={`${metric.behaviorName}-${metric.name}-${idx}`}
                          sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                      >
                        <TableCell>
                          <Chip
                              icon={metric.passed ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />}
                              label={metric.passed ? 'Pass' : 'Fail'}
                              size="small"
                              color={metric.passed ? 'success' : 'error'}
                              sx={{ minWidth: 80 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip label={metric.behaviorName} size="small" variant="outlined" />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {metric.name}
                            </Typography>
                            {metric.description && (
                                <Tooltip title={metric.description} arrow placement="top" enterDelay={300}>
                                  <InfoOutlinedIcon
                                      sx={{
                                        fontSize: 16,
                                        color: 'action.active',
                                        opacity: 0.6,
                                        cursor: 'help',
                                        '&:hover': { opacity: 1 },
                                      }}
                                  />
                                </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>
                          {metric.fullMetricData.reason ? (
                              <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                                {metric.fullMetricData.reason}
                              </Typography>
                          ) : (
                              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                No reason provided
                              </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
  );
}
