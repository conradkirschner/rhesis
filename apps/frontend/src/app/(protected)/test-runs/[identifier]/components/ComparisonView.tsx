'use client';

import {useCallback, useState, useMemo, useEffect} from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Paper,
  useTheme,
  TextField,
  InputAdornment,
  ButtonGroup,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import RemoveIcon from '@mui/icons-material/Remove';
import ListIcon from '@mui/icons-material/List';
import { alpha } from '@mui/material/styles';
import {MetricResult, TestResultDetail} from '@/api-client';


type AvailableRun = {
  id: string;
  name?: string;
  created_at: string;
  pass_rate?: number;
};

type PromptMap = Record<string, { content: string; name?: string }>;

type BehaviorSpec = {
  id: string;
  name: string;
  description?: string;
  metrics: Array<{ name: string; description?: string }>;
};

interface ComparisonViewProps {
  currentTestRun: {
    id: string;
    name?: string;
    created_at: string;
  };
  currentTestResults: TestResultDetail[];
  availableTestRuns: AvailableRun[];
  onClose: () => void;
  onLoadBaseline: (testRunId: string) => Promise<TestResultDetail[]>;
  prompts: PromptMap;
  behaviors: BehaviorSpec[];
}

type StatusFilter = 'all' | 'improved' | 'regressed' | 'unchanged';

interface ComparisonTest {
  id: string;
  baseline?: TestResultDetail;
  current: TestResultDetail;
}

/** -------- Component -------- */

export default function ComparisonView({
                                         currentTestRun,
                                         currentTestResults,
                                         availableTestRuns,
                                         onClose,
                                         onLoadBaseline,
                                         prompts,
                                         behaviors,
                                       }: ComparisonViewProps) {
  const theme = useTheme();

  // Safe fallbacks for custom palette tokens some themes define
  const bgLight1 =
      (theme.palette.background as unknown as Record<string, string>).light1 ??
      theme.palette.action.hover;
  const bgLight2 =
      (theme.palette.background as unknown as Record<string, string>).light2 ??
      alpha(theme.palette.text.primary, 0.04);
  const bgLight3 =
      (theme.palette.background as unknown as Record<string, string>).light3 ??
      alpha(theme.palette.text.primary, 0.06);

  const [selectedBaselineId, setSelectedBaselineId] = useState<string>(
      availableTestRuns[0]?.id || '',
  );
  const [baselineTestResults, setBaselineTestResults] =
      useState<TestResultDetail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(
      null,
  );
  const [statusFilter, setStatusFilter] =
      useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load baseline when selection changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedBaselineId) {
        setBaselineTestResults(null);
        return;
      }
      setLoading(true);
      try {
        const data = await onLoadBaseline(selectedBaselineId);
        if (!cancelled) setBaselineTestResults(data);
      } catch (err) {
        if (!cancelled) setBaselineTestResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedBaselineId, onLoadBaseline]);

  const baselineRun = useMemo(
      () => availableTestRuns.find((r) => r.id === selectedBaselineId),
      [availableTestRuns, selectedBaselineId],
  );

  // Helpers
  const valuesOfMetrics = (test?: TestResultDetail): MetricResult[] => {
    const metrics = test?.test_metrics?.metrics ?? undefined;
    return metrics ? Object.values(metrics) : [];
  };

  const isTestPassed = useCallback((test: TestResultDetail): boolean => {
    const vals = valuesOfMetrics(test);
    const total = vals.length;
    const passed = vals.filter((m) => Boolean(m?.is_successful)).length;
    return total > 0 && passed === total;
  }, []);

  const getPassRate = (test: TestResultDetail): number => {
    const vals = valuesOfMetrics(test);
    const total = vals.length;
    if (total === 0) return 0;
    const passed = vals.filter((m) => Boolean(m?.is_successful)).length;
    return (passed / total) * 100;
  };

  const formatDate = (iso?: string): string => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? 'N/A'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPromptSnippet = (test: TestResultDetail, maxLen = 80): string => {
    const pid = test.prompt_id ?? undefined;
    const content = pid && prompts[pid]?.content ? prompts[pid].content : '';
    if (!content) return `Test #${test.id.slice(0, 8)}`;
    return content.length <= maxLen ? content : content.slice(0, maxLen).trim() + '…';
  };

  // Baseline pass-rate (from loaded baseline tests)
  const baselinePassRate = useMemo(() => {
    if (!baselineTestResults || baselineTestResults.length === 0) return undefined;
    const passed = baselineTestResults.filter(isTestPassed).length;
    return (passed / baselineTestResults.length) * 100;
  }, [baselineTestResults, isTestPassed]);

  // Build comparison pairs (unfiltered)
  const allComparisonTests = useMemo<ComparisonTest[]>(() => {
    if (!baselineTestResults) return [];
    return currentTestResults.map((current, idx) => {
      const baseline =
          baselineTestResults.find((b) => b.prompt_id && b.prompt_id === current.prompt_id) ??
          baselineTestResults[idx];
      return { id: current.id, baseline, current };
    });
  }, [currentTestResults, baselineTestResults]);

  // Filtered list for display
  const comparisonTests = useMemo<ComparisonTest[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    return allComparisonTests.filter((test) => {
      // Status filter
      if (statusFilter !== 'all') {
        const baselineState = test.baseline ? isTestPassed(test.baseline) : null;
        const currentState = isTestPassed(test.current);
        const improved = baselineState !== null && currentState && !baselineState;
        const regressed = baselineState !== null && !currentState && baselineState;
        const unchanged = !improved && !regressed;
        if (statusFilter === 'improved' && !improved) return false;
        if (statusFilter === 'regressed' && !regressed) return false;
        if (statusFilter === 'unchanged' && !unchanged) return false;
      }

      // Search filter
      if (q) {
        const pid = test.current.prompt_id ?? undefined;
        const promptText = pid && prompts[pid]?.content ? prompts[pid].content.toLowerCase() : '';
        const responseText = (test.current.test_output?.output ?? '').toLowerCase();
        if (!promptText.includes(q) && !responseText.includes(q)) return false;
      }

      return true;
    });
  }, [searchQuery, allComparisonTests, statusFilter, isTestPassed, prompts]);

  // Stats from all pairs (not the filtered ones)
  const stats = useMemo(() => {
    if (!baselineTestResults) return { improved: 0, regressed: 0, unchanged: 0 };
    let improved = 0;
    let regressed = 0;
    let unchanged = 0;
    for (const test of allComparisonTests) {
      if (!test.baseline) continue;
      const b = isTestPassed(test.baseline);
      const c = isTestPassed(test.current);
      if (c && !b) improved++;
      else if (!c && b) regressed++;
      else unchanged++;
    }
    return { improved, regressed, unchanged };
  }, [allComparisonTests, baselineTestResults, isTestPassed]);

  const selectedTest = useMemo(
      () => allComparisonTests.find((t) => t.id === selectedTestId),
      [allComparisonTests, selectedTestId],
  );

  const currentPassRate = useMemo(() => {
    const passed = currentTestResults.filter(isTestPassed).length;
    return Math.round((passed / Math.max(1, currentTestResults.length)) * 100);
  }, [currentTestResults, isTestPassed]);

  if (loading && !baselineTestResults) {
    return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading comparison data...</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Box>
    );
  }

  return (
      <Box sx={{ pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4">Run Comparison</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Comparison headers */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Baseline */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Baseline Run
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Select baseline run</InputLabel>
                  <Select
                      value={selectedBaselineId}
                      label="Select baseline run"
                      onChange={(e) => setSelectedBaselineId(e.target.value)}
                  >
                    {availableTestRuns.map((run) => (
                        <MenuItem key={run.id} value={run.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{run.name || `Run #${run.id.slice(0, 8)}`}</span>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(run.created_at)}
                            </Typography>
                          </Box>
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {baselineRun && (
                    <>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(baselineRun.created_at)}
                      </Typography>
                      {baselinePassRate !== undefined && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Pass rate:
                            </Typography>
                            <Chip label={`${Math.round(baselinePassRate)}%`} size="small" />
                          </Box>
                      )}
                    </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Current */}
          <Grid item xs={12} md={6}>
            <Card
                sx={{
                  bgcolor: bgLight2,
                  border: `2px solid ${theme.palette.primary.main}`,
                  height: '100%',
                }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Current Run
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  {currentTestRun.name || `Run #${currentTestRun.id.slice(0, 8)}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  {formatDate(currentTestRun.created_at)}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Pass rate:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {currentPassRate}%
                  </Typography>
                  {baselinePassRate !== undefined && (
                      <Typography
                          variant="caption"
                          sx={{
                            color:
                                currentPassRate > baselinePassRate
                                    ? theme.palette.success.main
                                    : currentPassRate < baselinePassRate
                                        ? theme.palette.error.main
                                        : theme.palette.text.secondary,
                            fontWeight: 500,
                          }}
                      >
                        ({currentPassRate > baselinePassRate ? '+' : ''}
                        {(currentPassRate - baselinePassRate).toFixed(1)}%)
                      </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter bar */}
        {baselineTestResults && (
            <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 3,
                  alignItems: { xs: 'stretch', sm: 'center' },
                }}
            >
              <TextField
                  size="small"
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: { xs: '100%', sm: 250 } }}
              />

              <ButtonGroup size="small" variant="outlined">
                <Button
                    onClick={() => setStatusFilter('all')}
                    variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                    startIcon={<ListIcon fontSize="small" />}
                >
                  All
                </Button>
                <Button
                    onClick={() => setStatusFilter('improved')}
                    variant={statusFilter === 'improved' ? 'contained' : 'outlined'}
                    startIcon={<TrendingUpIcon fontSize="small" />}
                    sx={
                      statusFilter === 'improved'
                          ? {
                            bgcolor: theme.palette.success.main,
                            color: 'white',
                            '&:hover': { bgcolor: theme.palette.success.dark },
                          }
                          : undefined
                    }
                >
                  Improved
                </Button>
                <Button
                    onClick={() => setStatusFilter('regressed')}
                    variant={statusFilter === 'regressed' ? 'contained' : 'outlined'}
                    startIcon={<TrendingDownIcon fontSize="small" />}
                    sx={
                      statusFilter === 'regressed'
                          ? {
                            bgcolor: theme.palette.error.main,
                            color: 'white',
                            '&:hover': { bgcolor: theme.palette.error.dark },
                          }
                          : undefined
                    }
                >
                  Regressed
                </Button>
                <Button
                    onClick={() => setStatusFilter('unchanged')}
                    variant={statusFilter === 'unchanged' ? 'contained' : 'outlined'}
                    startIcon={<RemoveIcon fontSize="small" />}
                >
                  Unchanged
                </Button>
              </ButtonGroup>

              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                {comparisonTests.length} test{comparisonTests.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
        )}

        {/* Stats */}
        {baselineTestResults && (
            <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  mb: 4,
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  bgcolor: theme.palette.background.default,
                }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                <Box>
                  <Typography variant="h6" component="span" sx={{ mr: 0.5 }}>
                    {stats.improved}
                  </Typography>
                  <Typography variant="body2" component="span" color="text.secondary">
                    improved
                  </Typography>
                </Box>
              </Box>

              {stats.regressed > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                    <Box>
                      <Typography variant="h6" component="span" sx={{ mr: 0.5 }}>
                        {stats.regressed}
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary">
                        regressed
                      </Typography>
                    </Box>
                  </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                      sx={{
                        width: 16,
                        height: 2,
                        bgcolor: theme.palette.text.secondary,
                        borderRadius: theme.shape.borderRadius / 4,
                      }}
                  />
                </Box>
                <Box>
                  <Typography variant="h6" component="span" sx={{ mr: 0.5 }}>
                    {stats.unchanged}
                  </Typography>
                  <Typography variant="body2" component="span" color="text.secondary">
                    unchanged
                  </Typography>
                </Box>
              </Box>
            </Paper>
        )}

        {/* List of comparisons */}
        {baselineTestResults && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Test-by-Test Comparison</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click any test to view details
                  </Typography>
                </Box>

                <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                  {comparisonTests.map((test) => {
                    const baselinePassed =
                        test.baseline != null ? isTestPassed(test.baseline) : null;
                    const currentPassed = isTestPassed(test.current);

                    const improved = baselinePassed !== null && currentPassed && !baselinePassed;
                    const regressed = baselinePassed !== null && !currentPassed && baselinePassed;

                    const baselineVals = valuesOfMetrics(test.baseline);
                    const currentVals = valuesOfMetrics(test.current);

                    const baselinePassedCount = baselineVals.filter((m) => m.is_successful).length;
                    const currentPassedCount = currentVals.filter((m) => m.is_successful).length;

                    return (
                        <Paper
                            key={test.id}
                            variant="outlined"
                            sx={{
                              mb: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                boxShadow: theme.shadows[2],
                                borderColor: theme.palette.primary.main,
                                bgcolor: bgLight1,
                              },
                            }}
                            onClick={() => setSelectedTestId(test.id)}
                        >
                          <Grid container spacing={0}>
                            {/* Baseline */}
                            <Grid
                                item
                                xs={12}
                                md={6}
                                sx={{
                                  p: 3,
                                  borderRight: { md: 1 },
                                  borderColor: 'divider',
                                  bgcolor: 'transparent',
                                }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                {baselinePassed !== null &&
                                    (baselinePassed ? (
                                        <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                    ) : (
                                        <CancelIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                    ))}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {getPromptSnippet(test.current)}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {baselinePassed !== null ? (baselinePassed ? 'Passed' : 'Failed') : 'No data'}{' '}
                                    {baselinePassed !== null && `(${baselinePassedCount}/${baselineVals.length})`}
                                  </Typography>
                                  {test.baseline && (
                                      <Typography variant="caption" color="text.secondary">
                                        Score: {getPassRate(test.baseline).toFixed(0)}%
                                      </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Grid>

                            {/* Current */}
                            <Grid
                                item
                                xs={12}
                                md={6}
                                sx={{
                                  p: 3,
                                  bgcolor: improved
                                      ? theme.palette.mode === 'light'
                                          ? alpha(theme.palette.success.main, 0.08)
                                          : bgLight3
                                      : regressed
                                          ? theme.palette.mode === 'light'
                                              ? alpha(theme.palette.error.main, 0.08)
                                              : bgLight3
                                          : 'transparent',
                                }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                {currentPassed ? (
                                    <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                ) : (
                                    <CancelIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                )}
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="subtitle2">
                                      {getPromptSnippet(test.current)}
                                    </Typography>
                                    {improved && <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main }} />}
                                    {regressed && (
                                        <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                    )}
                                  </Box>
                                  <Typography variant="caption" display="block">
                                    {currentPassed ? 'Passed' : 'Failed'} ({currentPassedCount}/{currentVals.length})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Score: {getPassRate(test.current).toFixed(0)}%
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
        )}

        {/* Detail dialog */}
        <Dialog
            open={selectedTestId !== null}
            onClose={() => setSelectedTestId(null)}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { height: '90vh' } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Test #{(comparisonTests.findIndex((t) => t.id === selectedTestId) + 1).toString()} - Detailed Comparison
              </Typography>
              <IconButton onClick={() => setSelectedTestId(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers>
            {selectedTest && (
                <Grid container spacing={3} sx={{ height: '100%' }}>
                  {/* Baseline column */}
                  <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: 1 }, borderColor: 'divider' }}>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                        Baseline Run
                      </Typography>
                      {selectedTest.baseline ? (
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {baselineRun && formatDate(baselineRun.created_at)}
                            </Typography>
                            <Chip
                                label={
                                  isTestPassed(selectedTest.baseline)
                                      ? `Passed (${valuesOfMetrics(selectedTest.baseline).filter((m) => m.is_successful).length}/${valuesOfMetrics(selectedTest.baseline).length})`
                                      : `Failed (${valuesOfMetrics(selectedTest.baseline).filter((m) => m.is_successful).length}/${valuesOfMetrics(selectedTest.baseline).length})`
                                }
                                color={isTestPassed(selectedTest.baseline) ? 'success' : 'error'}
                                size="small"
                                sx={{ mt: 1 }}
                            />
                          </>
                      ) : (
                          <Box sx={{ mt: 1 }}>
                            <Chip label="No baseline data for this test" size="small" />
                          </Box>
                      )}
                    </Box>

                    {selectedTest.baseline ? (
                        <Box sx={{ maxHeight: 'calc(90vh - 200px)', overflow: 'auto', pr: 2 }}>
                          {/* Prompt */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                              Prompt
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: bgLight1 }}>
                              <Typography variant="body2">
                                {selectedTest.baseline.prompt_id &&
                                prompts[selectedTest.baseline.prompt_id]
                                    ? prompts[selectedTest.baseline.prompt_id].content
                                    : 'No prompt available'}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Response */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                              Response
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: bgLight1 }}>
                              <Typography variant="body2">
                                {selectedTest.baseline.test_output?.output || 'No response available'}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Metrics by behavior */}
                          <Typography variant="h6" sx={{ mb: 3 }}>
                            Metrics Breakdown
                          </Typography>

                          {behaviors.map((behavior) => {
                            const behaviorMetrics = behavior.metrics
                                .map((metric) => ({
                                  ...metric,
                                  baselineResult:
                                      selectedTest.baseline?.test_metrics?.metrics?.[metric.name],
                                  currentResult:
                                      selectedTest.current?.test_metrics?.metrics?.[metric.name],
                                }))
                                .filter((m) => m.baselineResult || m.currentResult);

                            if (behaviorMetrics.length === 0) return null;

                            const baselinePassedCount = behaviorMetrics.filter(
                                (m) => m.baselineResult?.is_successful,
                            ).length;

                            return (
                                <Accordion
                                    key={behavior.id}
                                    sx={{
                                      mb: 2,
                                      '&:before': { display: 'none' },
                                      boxShadow: 'none',
                                      border: 1,
                                      borderColor: 'divider',
                                    }}
                                    defaultExpanded
                                >
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                      <Typography variant="body2">{behavior.name}</Typography>
                                      <Chip
                                          label={`${baselinePassedCount}/${behaviorMetrics.length}`}
                                          size="small"
                                          color={
                                            baselinePassedCount === behaviorMetrics.length ? 'success' : 'error'
                                          }
                                      />
                                    </Box>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {behaviorMetrics.map((metric) => {
                                        const sB = metric.baselineResult?.score;
                                        const sC = metric.currentResult?.score;
                                        const scoreDiff =
                                            sB != null && sC != null
                                                ? Number(sC) - Number(sB)
                                                : null;
                                        const hasScoreChange =
                                            scoreDiff !== null && Math.abs(scoreDiff) > 0.01;

                                        return (
                                            <Paper key={metric.name} variant="outlined" sx={{ p: 3 }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                {metric.baselineResult?.is_successful ? (
                                                    <CheckCircleIcon
                                                        fontSize="small"
                                                        sx={{ color: theme.palette.success.main }}
                                                    />
                                                ) : (
                                                    <CancelIcon
                                                        fontSize="small"
                                                        sx={{ color: theme.palette.error.main }}
                                                    />
                                                )}
                                                <Box sx={{ flex: 1 }}>
                                                  <Typography variant="subtitle2" gutterBottom>
                                                    {metric.name}
                                                  </Typography>

                                                  {sB != null && (
                                                      <Box sx={{ mb: 1 }}>
                                                        <Box
                                                            sx={{
                                                              display: 'flex',
                                                              justifyContent: 'space-between',
                                                              mb: 0.5,
                                                            }}
                                                        >
                                                          <Typography variant="caption">
                                                            Score: {Number(sB).toFixed(2)}
                                                            {hasScoreChange && (
                                                                <Typography
                                                                    component="span"
                                                                    variant="caption"
                                                                    sx={{
                                                                      ml: 0.5,
                                                                      color:
                                                                          (scoreDiff ?? 0) > 0
                                                                              ? theme.palette.success.main
                                                                              : theme.palette.error.main,
                                                                      fontWeight: 500,
                                                                    }}
                                                                >
                                                                  ({(scoreDiff ?? 0) > 0 ? '+' : ''}
                                                                  {(scoreDiff ?? 0).toFixed(2)})
                                                                </Typography>
                                                            )}
                                                          </Typography>
                                                          {metric.baselineResult?.threshold != null && (
                                                              <Typography variant="caption" color="text.secondary">
                                                                Threshold: ≥
                                                                {Number(metric.baselineResult.threshold).toFixed(2)}
                                                              </Typography>
                                                          )}
                                                        </Box>

                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={Number(sB) * 100}
                                                            color={
                                                              metric.baselineResult?.is_successful ? 'success' : 'error'
                                                            }
                                                            sx={{
                                                              height: 8,
                                                              borderRadius: theme.shape.borderRadius / 4,
                                                              bgcolor: bgLight2,
                                                            }}
                                                        />
                                                      </Box>
                                                  )}

                                                  {metric.baselineResult?.reason && (
                                                      <Typography variant="caption" color="text.secondary">
                                                        {metric.baselineResult.reason}
                                                      </Typography>
                                                  )}
                                                </Box>
                                              </Box>
                                            </Paper>
                                        );
                                      })}
                                    </Box>
                                  </AccordionDetails>
                                </Accordion>
                            );
                          })}
                        </Box>
                    ) : (
                        <Box sx={{ p: 2 }}>
                          <Chip label="No baseline data available for comparison" size="small" />
                        </Box>
                    )}
                  </Grid>

                  {/* Current column */}
                  <Grid item xs={12} md={6} sx={{ p: 3 }}>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                        Current Run
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(currentTestRun.created_at)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip
                            label={
                              isTestPassed(selectedTest.current)
                                  ? `Passed (${valuesOfMetrics(selectedTest.current).filter((m) => m.is_successful).length}/${valuesOfMetrics(selectedTest.current).length})`
                                  : `Failed (${valuesOfMetrics(selectedTest.current).filter((m) => m.is_successful).length}/${valuesOfMetrics(selectedTest.current).length})`
                            }
                            color={isTestPassed(selectedTest.current) ? 'success' : 'error'}
                            size="small"
                        />
                        {selectedTest.baseline && (
                            <>
                              {isTestPassed(selectedTest.current) && !isTestPassed(selectedTest.baseline) && (
                                  <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                              )}
                              {!isTestPassed(selectedTest.current) && isTestPassed(selectedTest.baseline) && (
                                  <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                              )}
                            </>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ maxHeight: 'calc(90vh - 200px)', overflow: 'auto', pr: 2 }}>
                      {/* Prompt */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                          Prompt
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: bgLight1 }}>
                          <Typography variant="body2">
                            {selectedTest.current.prompt_id &&
                            prompts[selectedTest.current.prompt_id]
                                ? prompts[selectedTest.current.prompt_id].content
                                : 'No prompt available'}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Response */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                          Response
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: bgLight1 }}>
                          <Typography variant="body2">
                            {selectedTest.current.test_output?.output || 'No response available'}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Metrics by behavior */}
                      <Typography variant="h6" sx={{ mb: 3 }}>
                        Metrics Breakdown
                      </Typography>

                      {behaviors.map((behavior) => {
                        const behaviorMetrics = behavior.metrics
                            .map((metric) => ({
                              ...metric,
                              currentResult:
                                  selectedTest.current?.test_metrics?.metrics?.[metric.name],
                              baselineResult:
                                  selectedTest.baseline?.test_metrics?.metrics?.[metric.name],
                            }))
                            .filter((m) => m.currentResult || m.baselineResult);

                        if (behaviorMetrics.length === 0) return null;

                        const currentPassedCount = behaviorMetrics.filter(
                            (m) => m.currentResult?.is_successful,
                        ).length;
                        const baselinePassedCount = behaviorMetrics.filter(
                            (m) => m.baselineResult?.is_successful,
                        ).length;
                        const hasChanges = currentPassedCount !== baselinePassedCount;

                        return (
                            <Accordion
                                key={behavior.id}
                                sx={{
                                  mb: 2,
                                  '&:before': { display: 'none' },
                                  boxShadow: 'none',
                                  border: 1,
                                  borderColor: 'divider',
                                }}
                                defaultExpanded={hasChanges}
                            >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                  <Typography variant="body2">{behavior.name}</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip
                                        label={`${currentPassedCount}/${behaviorMetrics.length}`}
                                        size="small"
                                        color={
                                          currentPassedCount === behaviorMetrics.length ? 'success' : 'error'
                                        }
                                    />
                                    {hasChanges &&
                                        (currentPassedCount > baselinePassedCount ? (
                                            <TrendingUpIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.success.main }}
                                            />
                                        ) : (
                                            <TrendingDownIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.error.main }}
                                            />
                                        ))}
                                  </Box>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {behaviorMetrics.map((metric) => {
                                    const sC = metric.currentResult?.score;
                                    const sB = metric.baselineResult?.score;
                                    const scoreDiff =
                                        sB != null && sC != null ? Number(sC) - Number(sB) : null;
                                    const hasScoreChange =
                                        scoreDiff !== null && Math.abs(scoreDiff) > 0.01;
                                    const statusChanged =
                                        metric.baselineResult &&
                                        metric.currentResult &&
                                        metric.baselineResult.is_successful !==
                                        metric.currentResult.is_successful;

                                    return (
                                        <Paper
                                            key={metric.name}
                                            variant="outlined"
                                            sx={{
                                              p: 3,
                                              bgcolor: statusChanged
                                                  ? metric.currentResult?.is_successful
                                                      ? theme.palette.mode === 'light'
                                                          ? alpha(theme.palette.success.main, 0.08)
                                                          : bgLight3
                                                      : theme.palette.mode === 'light'
                                                          ? alpha(theme.palette.error.main, 0.08)
                                                          : bgLight3
                                                  : 'transparent',
                                            }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            {metric.currentResult?.is_successful ? (
                                                <CheckCircleIcon
                                                    fontSize="small"
                                                    sx={{ color: theme.palette.success.main }}
                                                />
                                            ) : (
                                                <CancelIcon
                                                    fontSize="small"
                                                    sx={{ color: theme.palette.error.main }}
                                                />
                                            )}
                                            <Box sx={{ flex: 1 }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography variant="subtitle2">{metric.name}</Typography>
                                                {statusChanged &&
                                                    (metric.currentResult?.is_successful ? (
                                                        <TrendingUpIcon
                                                            fontSize="small"
                                                            sx={{ color: theme.palette.success.main }}
                                                        />
                                                    ) : (
                                                        <TrendingDownIcon
                                                            fontSize="small"
                                                            sx={{ color: theme.palette.error.main }}
                                                        />
                                                    ))}
                                              </Box>

                                              {sC != null && (
                                                  <Box sx={{ mb: 1 }}>
                                                    <Box
                                                        sx={{
                                                          display: 'flex',
                                                          justifyContent: 'space-between',
                                                          mb: 0.5,
                                                        }}
                                                    >
                                                      <Typography variant="caption">
                                                        Score: {Number(sC).toFixed(2)}
                                                        {hasScoreChange && (
                                                            <Typography
                                                                component="span"
                                                                variant="caption"
                                                                sx={{
                                                                  ml: 0.5,
                                                                  color:
                                                                      (scoreDiff ?? 0) > 0
                                                                          ? theme.palette.success.main
                                                                          : theme.palette.error.main,
                                                                  fontWeight: 500,
                                                                }}
                                                            >
                                                              ({(scoreDiff ?? 0) > 0 ? '+' : ''}
                                                              {(scoreDiff ?? 0).toFixed(2)})
                                                            </Typography>
                                                        )}
                                                      </Typography>
                                                      {metric.currentResult?.threshold != null && (
                                                          <Typography variant="caption" color="text.secondary">
                                                            Threshold: ≥
                                                            {Number(metric.currentResult.threshold).toFixed(2)}
                                                          </Typography>
                                                      )}
                                                    </Box>

                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Number(sC) * 100}
                                                        color={metric.currentResult?.is_successful ? 'success' : 'error'}
                                                        sx={{
                                                          height: 8,
                                                          borderRadius: theme.shape.borderRadius / 4,
                                                          bgcolor: bgLight2,
                                                        }}
                                                    />
                                                  </Box>
                                              )}

                                              {metric.currentResult?.reason && (
                                                  <Typography variant="caption" color="text.secondary">
                                                    {metric.currentResult.reason}
                                                  </Typography>
                                              )}
                                            </Box>
                                          </Box>
                                        </Paper>
                                    );
                                  })}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                        );
                      })}
                    </Box>
                  </Grid>
                </Grid>
            )}
          </DialogContent>
        </Dialog>
      </Box>
  );
}
