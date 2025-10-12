'use client';

import * as React from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import {
  readTestSetsTestSetsGetOptions,
  readTestRunsTestRunsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

// ---- Local narrow types (only what we actually render) ----
type Filters = Partial<{
  months: number;
  test_set_ids: string[];
  test_run_ids: string[];
}>;

type TestSetLite = { id: string; name?: string | null };
type TestRunLite = { id: string; name?: string | null };

type ListResponse<T> = { data: T[] };

// ---- Props ----
interface TestResultsFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  initialFilters?: Filters;
}

const TIME_RANGES = [
  { value: 1, label: 'Last Month' },
  { value: 3, label: 'Last 3 Months' },
  { value: 6, label: 'Last 6 Months' },
  { value: 12, label: 'Last Year' },
];

export default function TestResultsFilters({
                                             onFiltersChange,
                                             initialFilters = {},
                                           }: TestResultsFiltersProps) {
  const theme = useTheme();

  const sectionMedium = theme.customSpacing?.section?.medium ?? 2;
  const containerMedium = theme.customSpacing?.container?.medium ?? 2;

  const [filters, setFilters] = React.useState<Filters>(() => ({
    months: 6,
    ...initialFilters,
  }));

  const selectedTestSetId = filters.test_set_ids?.[0];
  const selectedTestRunId = filters.test_run_ids?.[0];

  // ---- Test Sets ----
  const testSetsQuery = useQuery({
    ...readTestSetsTestSetsGetOptions({
      query: { limit: 100, has_runs: true },
    }),
    staleTime: 60_000,
  });

  const testSets: TestSetLite[] =
      ((testSetsQuery.data as ListResponse<TestSetLite> | undefined)?.data) ?? [];

  // ---- Test Runs (optionally filtered by selected test set) ----
  const testRunsQuery = useQuery({
    ...readTestRunsTestRunsGetOptions({
      query: {
        limit: 100,
        $filter: selectedTestSetId
            ? `test_configuration/test_set/id eq '${selectedTestSetId}'`
            : undefined,
      },
    }),
    staleTime: 60_000,
  });

  const testRuns: TestRunLite[] =
      ((testRunsQuery.data as ListResponse<TestRunLite> | undefined)?.data) ?? [];

  // ---- Handlers ----
  const updateFilters = React.useCallback(
      (next: Filters) => {
        const updated = { ...filters, ...next };
        setFilters(updated);
        onFiltersChange(updated);
      },
      [filters, onFiltersChange],
  );

  const handleTimeRangeChange = (months: number) => {
    updateFilters({ months, start_date: undefined, end_date: undefined } as Filters);
  };

  const handleTestSetChange = (testSetId: string) => {
    updateFilters({
      test_set_ids: testSetId ? [testSetId] : undefined,
      test_run_ids: undefined, // reset run when set changes
    });
  };

  const handleTestRunChange = (testRunId: string) => {
    updateFilters({
      test_run_ids: testRunId ? [testRunId] : undefined,
    });
  };

  const clearFilters = () => {
    const cleared: Filters = { months: 6 };
    setFilters(cleared);
    onFiltersChange(cleared);
    // testRunsQuery will auto-refetch based on new params (no selected set)
  };

  const hasActiveFilters = React.useMemo(
      () =>
          Object.keys(filters).some(
              (k) =>
                  k !== 'months' &&
                  (filters as Record<string, unknown>)[k] !== undefined,
          ),
      [filters],
  );

  // ---- UI ----
  return (
      <Paper elevation={1} sx={{ p: containerMedium }}>
        <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: sectionMedium,
            }}
        >
          <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <FilterList />
            Filters
          </Typography>

          {hasActiveFilters && (
              <Button
                  variant="outlined"
                  size="small"
                  onClick={clearFilters}
                  startIcon={<Clear />}
              >
                Clear Filters
              </Button>
          )}
        </Box>

        <Grid container spacing={containerMedium}>
          {/* Time Range */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                  value={filters.months ?? 6}
                  label="Time Range"
                  onChange={(e) => handleTimeRangeChange(Number(e.target.value))}
              >
                {TIME_RANGES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Test Set */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Test Set</InputLabel>
              <Select
                  value={selectedTestSetId ?? ''}
                  label="Test Set"
                  onChange={(e) => handleTestSetChange(String(e.target.value))}
                  disabled={testSetsQuery.isLoading}
              >
                <MenuItem value="">All Test Sets</MenuItem>
                {testSets.map((ts) => (
                    <MenuItem key={ts.id} value={ts.id}>
                      {ts.name ?? ts.id}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Test Run (filtered by Test Set if selected) */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Test Run</InputLabel>
              <Select
                  value={selectedTestRunId ?? ''}
                  label="Test Run"
                  onChange={(e) => handleTestRunChange(String(e.target.value))}
                  disabled={
                      testRunsQuery.isLoading ||
                      Boolean(selectedTestSetId && testRuns.length === 0)
                  }
              >
                <MenuItem value="">All Test Runs</MenuItem>
                {testRuns.map((tr) => (
                    <MenuItem key={tr.id} value={tr.id}>
                      {tr.name ?? `Test Run ${tr.id.slice(0, 8)}`}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {hasActiveFilters && (
            <Box
                sx={{
                  mt: sectionMedium,
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Active filters:
              </Typography>

              {selectedTestSetId && (
                  <Chip
                      key="test_set"
                      label={`Test Set: ${
                          testSets.find((ts) => ts.id === selectedTestSetId)?.name ??
                          'Unknown'
                      }`}
                      size="small"
                      variant="outlined"
                      onDelete={() =>
                          updateFilters({
                            test_set_ids: undefined,
                            test_run_ids: undefined,
                          })
                      }
                  />
              )}

              {selectedTestRunId && (
                  <Chip
                      key="test_run"
                      label={`Test Run: ${
                          testRuns.find((tr) => tr.id === selectedTestRunId)?.name ??
                          'Unknown'
                      }`}
                      size="small"
                      variant="outlined"
                      onDelete={() => updateFilters({ test_run_ids: undefined })}
                  />
              )}

              {Object.entries(filters).map(([key, value]) => {
                if (
                    key === 'months' ||
                    key === 'test_set_ids' ||
                    key === 'test_run_ids' ||
                    value == null
                ) {
                  return null;
                }
                return (
                    <Chip
                        key={key}
                        label={`${key}: ${
                            Array.isArray(value) ? value.join(', ') : String(value)
                        }`}
                        size="small"
                        variant="outlined"
                        onDelete={() =>
                            updateFilters({ [key]: undefined } as unknown as Filters)
                        }
                    />
                );
              })}
            </Box>
        )}
      </Paper>
  );
}
