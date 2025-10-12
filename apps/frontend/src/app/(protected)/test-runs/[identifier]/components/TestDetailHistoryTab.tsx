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
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import { useQuery, useQueries } from '@tanstack/react-query';
import { formatDate } from '@/utils/date';

import {
  readTestResultsTestResultsGetOptions,
  readTestRunTestRunsTestRunIdGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

// ---- Local light-weight shapes we actually use from API responses ---- //
type MetricEval = { is_successful?: boolean | null };
type ResultLite = {
  id: string;
  test_run_id?: string | null;
  created_at?: string | null;
  test_metrics?: { metrics?: Record<string, MetricEval> | null } | null;
};
type Paginated<T> = { data: T[] };

type TestRunLite = { id: string; name?: string | null; created_at?: string | null };

// ---- Component props ---- //
interface TestDetailHistoryTabProps {
  test: { test_id?: string | null; id: string; prompt_id?: string | null };
  testRunId: string;
}

// ---- UI row shape ---- //
interface HistoricalResult {
  id: string;
  testRunId: string;
  testRunName: string;
  passed: boolean;
  passedMetrics: number;
  totalMetrics: number;
  executedAt: string;
}

export default function TestDetailHistoryTab({
                                               test,
                                               testRunId,
                                             }: TestDetailHistoryTabProps) {
  const theme = useTheme();

  // ---- First query: historical results for this test ---- //
  const resultsQuery = useQuery({
    ...readTestResultsTestResultsGetOptions({
      query: {
        $filter: test.test_id ? `test_id eq '${test.test_id}'` : undefined,
        limit: 50,
        skip: 0,
      },
    }),
    enabled: Boolean(test.test_id),
    staleTime: 60_000,
  });

  // Normalize and memoize result page + list to avoid ESLint deps warnings.
  const page = React.useMemo(() => {
    return (resultsQuery.data as Paginated<ResultLite> | undefined) ?? { data: [] };
  }, [resultsQuery.data]);

  const results = React.useMemo<ReadonlyArray<ResultLite>>(
      () => page.data ?? [],
      [page],
  );

  // ---- Unique test-run IDs (memoized) ---- //
  const runIds = React.useMemo<string[]>(
      () => Array.from(new Set(results.map(r => r.test_run_id).filter((v): v is string => !!v))),
      [results],
  );

  // ---- Dependent queries: fetch each run’s name ---- //
  const runDetailQueries = useQueries({
    queries: runIds.map((id) => ({
      ...readTestRunTestRunsTestRunIdGetOptions({
        path: { test_run_id: id },
      }),
      enabled: Boolean(id),
      staleTime: 5 * 60_000,
    })),
  });

  // Build a map id -> name (only for successful queries)
  const runNameMap = React.useMemo(() => {
    const m = new Map<string, string>();
    runDetailQueries.forEach((q, idx) => {
      const id = runIds[idx];
      const run = q.data as TestRunLite | undefined;
      if (id) m.set(id, (run?.name ?? id));
    });
    return m;
  }, [runDetailQueries, runIds]);

  // ---- Derive historical rows (dedup per run, newest first, limit 10) ---- //
  const history = React.useMemo<HistoricalResult[]>(() => {
    const rows = results.map((r) => {
      const metrics = r.test_metrics?.metrics ?? {};
      const values = Object.values(metrics ?? {});
      const passedMetrics = values.filter((m) => m?.is_successful).length;
      const totalMetrics = values.length;
      const passed = totalMetrics > 0 && passedMetrics === totalMetrics;

      const runId = r.test_run_id ?? 'unknown';
      const runName = runId === 'unknown' ? 'unknown' : (runNameMap.get(runId) ?? runId);

      return {
        id: r.id,
        testRunId: runId,
        testRunName: runName,
        passed,
        passedMetrics,
        totalMetrics,
        executedAt: r.created_at ?? new Date().toISOString(),
      };
    });

    // Sort desc by executedAt
    rows.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

    // Dedup by testRunId (keep first/latest)
    const perRun = new Map<string, HistoricalResult>();
    for (const row of rows) {
      if (!perRun.has(row.testRunId)) perRun.set(row.testRunId, row);
    }

    // Back to array, sorted, top 10
    return Array.from(perRun.values())
        .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
        .slice(0, 10);
  }, [results, runNameMap]);

  // ---- Loading / error states ---- //
  if (resultsQuery.isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
    );
  }

  if (resultsQuery.isError) {
    const msg =  resultsQuery.error.message;
    return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{msg}</Alert>
        </Box>
    );
  }

  return (
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Test Execution History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Last 10 test runs where this test was executed
        </Typography>

        {history.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No historical data available for this test
              </Typography>
            </Paper>
        ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Test Run</TableCell>
                    <TableCell>Metrics</TableCell>
                    <TableCell>Executed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                      <TableRow
                          key={item.id}
                          sx={{
                            backgroundColor:
                                item.testRunId === testRunId ? theme.palette.action.selected : 'transparent',
                            '&:hover': { backgroundColor: theme.palette.action.hover },
                          }}
                      >
                        <TableCell>
                          <Chip
                              icon={item.passed ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />}
                              label={item.passed ? 'Pass' : 'Fail'}
                              size="small"
                              color={item.passed ? 'success' : 'error'}
                              sx={{ minWidth: 80 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.testRunId !== 'unknown' ? (
                                <Link
                                    href={`/test-runs/${item.testRunId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none' }}
                                >
                                  <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        '&:hover .test-run-name': {
                                          color: 'primary.main',
                                          textDecoration: 'underline',
                                        },
                                      }}
                                  >
                                    <Typography
                                        variant="body2"
                                        className="test-run-name"
                                        sx={{
                                          transition: 'color 0.2s',
                                          color: item.testRunId === testRunId ? 'primary.main' : 'text.primary',
                                          fontWeight: item.testRunId === testRunId ? 600 : 400,
                                        }}
                                    >
                                      {item.testRunName}
                                    </Typography>
                                    <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  </Box>
                                </Link>
                            ) : (
                                <Typography variant="body2">{item.testRunName}</Typography>
                            )}
                            {item.testRunId === testRunId && (
                                <Chip label="Current" size="small" color="primary" />
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {item.passedMetrics}/{item.totalMetrics} passed
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(item.executedAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
        )}

        {/* Summary */}
        {history.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Summary Statistics
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Executions
                    </Typography>
                    <Typography variant="h6">{history.length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pass Rate
                    </Typography>
                    <Typography
                        variant="h6"
                        color={
                          history.filter(h => h.passed).length / history.length >= 0.8
                              ? 'success.main'
                              : 'error.main'
                        }
                    >
                      {((history.filter(h => h.passed).length / history.length) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Passed
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {history.filter(h => h.passed).length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Failed
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {history.filter(h => !h.passed).length}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
        )}
      </Box>
  );
}
