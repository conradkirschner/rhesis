'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Box, Grid, Paper } from '@mui/material';

import TestRunFilterBar, { FilterState } from './TestRunFilterBar';
import TestsList from './TestsList';
import TestDetailPanel from './TestDetailPanel';
import ComparisonView from './ComparisonView';
import TestRunHeader from './TestRunHeader';

import type { TestResultDetail, TestRunDetail } from '@/api-client/types.gen';

import {
  readTestRunsTestRunsGetOptions,
  readTestResultsTestResultsGetOptions,
  downloadTestRunResultsTestRunsTestRunIdDownloadGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

import { useNotifications } from '@/components/common/NotificationContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface TestRunMainViewProps {
  testRunId: string;
  testRunData: {
    id: string;
    name?: string;
    created_at: string;
    test_configuration_id?: string;
  };
  testRun: TestRunDetail;
  testResults: TestResultDetail[];
  prompts: Record<string, { content: string; name?: string }>;
  behaviors: Array<{
    id: string;
    name: string;
    description?: string;
    metrics: Array<{ name: string; description?: string }>;
  }>;
  loading?: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserPicture?: string;
}

export default function TestRunMainView({
                                          testRunId,
                                          testRunData,
                                          testRun,
                                          testResults: initialTestResults,
                                          prompts,
                                          behaviors,
                                          loading = false,
                                          currentUserId,
                                          currentUserName,
                                          currentUserPicture,
                                        }: TestRunMainViewProps) {
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  const [testResultUpdates, setTestResultUpdates] = useState<
      Map<string, TestResultDetail>
  >(new Map());

  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    statusFilter: 'all',
    selectedBehaviors: [],
  });

  const testResults = useMemo(() => {
    if (testResultUpdates.size === 0) return initialTestResults;
    return initialTestResults.map((t) => testResultUpdates.get(t.id) ?? t);
  }, [initialTestResults, testResultUpdates]);

  const selectedTest = useMemo(
      () => testResults.find((t) => t.id === selectedTestId) ?? null,
      [testResults, selectedTestId],
  );

  const filteredTests = useMemo(() => {
    let list = [...testResults];

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter((t) => {
        const promptContent =
            (t.prompt_id && prompts[t.prompt_id]?.content?.toLowerCase()) || '';
        const responseContent = t.test_output?.output?.toLowerCase() || '';
        return promptContent.includes(q) || responseContent.includes(q);
      });
    }

    if (filter.statusFilter !== 'all') {
      list = list.filter((t) => {
        const metrics = t.test_metrics?.metrics || {};
        const values = Object.values(metrics);
        const total = values.length;
        const passed = values.filter((m) => m?.is_successful).length;
        const isPassed = total > 0 && passed === total;
        return filter.statusFilter === 'passed' ? isPassed : !isPassed;
      });
    }

    if (filter.selectedBehaviors.length > 0) {
      list = list.filter((t) => {
        const metrics = t.test_metrics?.metrics || {};
        return filter.selectedBehaviors.some((behId) => {
          const behavior = behaviors.find((b) => b.id === behId);
          if (!behavior) return false;
          return behavior.metrics.some((m) => metrics[m.name]);
        });
      });
    }

    return list;
  }, [testResults, filter, prompts, behaviors]);

  const handleTestSelect = useCallback((testId: string) => {
    setSelectedTestId(testId);
  }, []);

  const handleFilterChange = useCallback(
      (newFilter: FilterState) => {
        setFilter(newFilter);
        const stillVisible = testResults.some((t) => t.id === selectedTestId);
        if (!stillVisible) setSelectedTestId(null);
      },
      [testResults, selectedTestId],
  );

  const handleTestResultUpdate = useCallback((updated: TestResultDetail) => {
    setTestResultUpdates((prev) => {
      const map = new Map(prev);
      map.set(updated.id, updated);
      return map;
    });
  }, []);

  const listTestRunsQueryParams = useMemo(() => {
    const base: Record<string, unknown> = {
      limit: 50,
      skip: 0,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    if (testRunData.test_configuration_id) {
      base.test_configuration_id = testRunData.test_configuration_id;
    }
    return base;
  }, [testRunData.test_configuration_id]);

  const listTestRunsQuery = useQuery({
    ...readTestRunsTestRunsGetOptions({
      query: listTestRunsQueryParams,
    }),
    staleTime: 60_000,
  });

  const availableTestRuns = useMemo<
      Array<{ id: string; name?: string; created_at: string; pass_rate?: number }>
  >(() => {
    const rows = (listTestRunsQuery.data as any)?.data ?? [];
    return rows
        .filter((r: any) => r?.id && r.id !== testRunId)
        .map((r: any) => ({
          id: r.id,
          name: r.name,
          created_at: r.attributes?.started_at || r.created_at || '',
          pass_rate: undefined,
        }));
  }, [listTestRunsQuery.data, testRunId]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const opts = downloadTestRunResultsTestRunsTestRunIdDownloadGetOptions({
        path: { test_run_id: testRunId },
      });
      const blob = (await queryClient.fetchQuery(opts)) as unknown as Blob;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_run_${testRunId}_results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      notifications.show('Test run results downloaded successfully', {
        severity: 'success',
      });
    } catch (err) {
      console.error(err);
      notifications.show('Failed to download test run results', {
        severity: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [testRunId, queryClient, notifications]);

  const handleCompare = useCallback(() => {
    if (!availableTestRuns.length) {
      notifications.show('No other test runs available for comparison', {
        severity: 'info',
      });
      return;
    }
    setIsComparisonMode(true);
  }, [availableTestRuns, notifications]);

  /** Page-by-page baseline loader without overriding `queryKey` */
  const handleLoadBaseline = useCallback(
      async (baselineTestRunId: string): Promise<TestResultDetail[]> => {
        try {
          const batchSize = 100;
          let skip = 0;
          let out: TestResultDetail[] = [];
          let totalCount: number | undefined;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const opts = readTestResultsTestResultsGetOptions({
              query: {
                filter: `test_run_id eq '${baselineTestRunId}'`,
                limit: batchSize,
                skip,
                sort_by: 'created_at',
                sort_order: 'desc',
              } as Record<string, unknown>,
            });

            const page = await queryClient.fetchQuery(opts);
            const pageData = (page as any)?.data ?? [];
            out = out.concat(pageData);

            const pagination = (page as any)?.pagination;
            if (typeof pagination?.totalCount === 'number') {
              totalCount = pagination.totalCount;
            }

            if (totalCount !== undefined) {
              if (out.length >= totalCount) break;
            } else {
              if (pageData.length < batchSize) break;
            }

            skip += batchSize;
            if (skip > 10_000) break; // safety
          }

          return out;
        } catch (err) {
          console.error('Error loading baseline test results:', err);
          notifications.show('Failed to load baseline test results', {
            severity: 'error',
          });
          return [];
        }
      },
      [queryClient, notifications],
  );

  React.useEffect(() => {
    if (!selectedTestId && filteredTests.length > 0) {
      setSelectedTestId(filteredTests[0].id);
    }
  }, [selectedTestId, filteredTests]);

  return (
      <Box>
        {!isComparisonMode && (
            <TestRunHeader testRun={testRun} testResults={testResults} />
        )}

        {!isComparisonMode ? (
            <>
              <TestRunFilterBar
                  filter={filter}
                  onFilterChange={handleFilterChange}
                  availableBehaviors={behaviors}
                  onDownload={handleDownload}
                  onCompare={handleCompare}
                  isDownloading={isDownloading}
                  totalTests={testResults.length}
                  filteredTests={filteredTests.length}
              />

              <Grid container spacing={3}>
                {/* Left list */}
                <Grid item xs={12} md={4}>
                  <Paper
                      sx={{
                        height: { xs: 400, md: 'calc(100vh - 420px)' },
                        minHeight: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                  >
                    <TestsList
                        tests={filteredTests}
                        selectedTestId={selectedTestId}
                        onTestSelect={handleTestSelect}
                        loading={loading}
                        prompts={prompts}
                    />
                  </Paper>
                </Grid>

                {/* Right detail panel */}
                <Grid item xs={12} md={8}>
                  <Paper
                      sx={{
                        height: { xs: 600, md: 'calc(100vh - 420px)' },
                        minHeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                  >
                    <TestDetailPanel
                        test={selectedTest}
                        loading={loading}
                        prompts={prompts}
                        behaviors={behaviors}
                        testRunId={testRunId}
                        onTestResultUpdate={handleTestResultUpdate}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        currentUserPicture={currentUserPicture}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </>
        ) : (
            <ComparisonView
                currentTestRun={testRunData}
                currentTestResults={testResults}
                availableTestRuns={availableTestRuns}
                onClose={() => setIsComparisonMode(false)}
                onLoadBaseline={handleLoadBaseline}
                prompts={prompts}
                behaviors={behaviors}
            />
        )}
      </Box>
  );
}
