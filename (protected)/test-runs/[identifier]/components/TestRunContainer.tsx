'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTestRunData, useTestRunHistory } from '@/hooks/data';
import type {
  UiBehavior,
  UiPromptMap,
  UiTestResult,
  UiTestRunHeaderProps,
  UiFilterState,
} from '../ui/types';

import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';

import TestRunHeader from '../ui/TestRunHeader';
import TestRunFilterBar from '../ui/TestRunFilterBar';
import TestsList from '../ui/TestsList';
import TestDetailPanel from '../ui/TestDetailPanel';
import ComparisonView from '../ui/ComparisonView';

type Props = { identifier: string };

export default function TestRunContainer({ identifier }: Props) {
  const router = useRouter();

  const {
    testRun,
    testResults,
    prompts,
    behaviors,
    availableTestRuns,
    isLoading,
    isError,
    error,
    downloadResults,
    loadBaselineResults,
  } = useTestRunData(identifier);

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filter, setFilter] = useState<UiFilterState>({
    searchQuery: '',
    statusFilter: 'all',
    selectedBehaviors: [],
  });

  const shapedPrompts: UiPromptMap = prompts;

  const shapedBehaviors: readonly UiBehavior[] = behaviors;

  const shapedResults: readonly UiTestResult[] = useMemo(() => {
    return (testResults ?? []).map((r) => ({
      id: r.id,
      testId: r.test_id ?? undefined,
      promptId: r.prompt_id ?? undefined,
      createdAt: r.created_at ?? undefined,
      outputText: r.test_output?.output ?? '',
      metrics: (r.test_metrics?.metrics ?? {}) as Record<
        string,
        { is_successful?: boolean | null; reason?: string | null; score?: number | null; threshold?: number | null }
      >,
      counts: {
        comments: r.counts?.comments ?? undefined,
        tasks: r.counts?.tasks ?? undefined,
      },
      tags: (Array.isArray(r.tags) ? r.tags : []).map((t) => t?.name ?? '').filter(Boolean),
    }));
  }, [testResults]);

  const headerProps = useMemo(
    () =>
      ({
        testRun: {
          id: testRun?.id ?? identifier,
          name: testRun?.name ?? undefined,
          startedAt: testRun?.attributes?.started_at ?? undefined,
          completedAt: testRun?.attributes?.completed_at ?? undefined,
          environment: testRun?.attributes?.environment ?? undefined,
          testConfiguration: {
            testSet: {
              id: testRun?.test_configuration?.test_set?.id ?? undefined,
              name: testRun?.test_configuration?.test_set?.name ?? undefined,
            },
            endpoint: {
              id: testRun?.test_configuration?.endpoint?.id ?? undefined,
              name: testRun?.test_configuration?.endpoint?.name ?? undefined,
            },
          },
        },
        testResults: shapedResults,
      } satisfies UiTestRunHeaderProps),
    [testRun, shapedResults, identifier],
  );

  const filteredResults = useMemo(() => {
    let list = [...shapedResults];

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter((t) => {
        const promptContent =
          (t.promptId && shapedPrompts[t.promptId]?.content?.toLowerCase()) || '';
        const responseContent = (t.outputText ?? '').toLowerCase();
        return promptContent.includes(q) || responseContent.includes(q);
      });
    }

    if (filter.statusFilter !== 'all') {
      list = list.filter((t) => {
        const values = Object.values(t.metrics ?? {});
        const total = values.length;
        const passed = values.filter((m) => m?.is_successful).length;
        const isPassed = total > 0 && passed === total;
        return filter.statusFilter === 'passed' ? isPassed : !isPassed;
      });
    }

    if (filter.selectedBehaviors.length > 0) {
      list = list.filter((t) => {
        const metrics = t.metrics ?? {};
        return filter.selectedBehaviors.some((behId) => {
          const behavior = shapedBehaviors.find((b) => b.id === behId);
          if (!behavior) return false;
          return behavior.metrics.some((m) => metrics[m.name]);
        });
      });
    }

    return list;
  }, [shapedResults, filter, shapedPrompts, shapedBehaviors]);

  useEffect(() => {
    if (!selectedTestId && filteredResults.length > 0) {
      setSelectedTestId(filteredResults[0].id);
    }
  }, [selectedTestId, filteredResults]);

  const selectedTest = useMemo(
    () => filteredResults.find((t) => t.id === selectedTestId) ?? null,
    [filteredResults, selectedTestId],
  );

  const { history, isLoading: historyLoading } = useTestRunHistory(selectedTest?.testId ?? null);

  const handleOpenTestSet = useCallback(() => {
    const id = testRun?.test_configuration?.test_set?.id;
    if (id) router.push(`/test-sets/${id}`);
  }, [router, testRun?.test_configuration?.test_set?.id]);

  const handleOpenEndpoint = useCallback(() => {
    const id = testRun?.test_configuration?.endpoint?.id;
    if (id) router.push(`/endpoints/${id}`);
  }, [router, testRun?.test_configuration?.endpoint?.id]);

  const handleOpenRun = useCallback(
    (runId: string) => {
      if (runId && runId !== 'unknown') router.push(`/test-runs/${runId}`);
    },
    [router],
  );

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadResults();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_run_${identifier}_results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [downloadResults, identifier]);

  const handleCompare = useCallback(() => {
    setIsComparisonMode(true);
  }, []);

  if (isLoading) {
    return (
      <FeaturePageFrame title={testRun?.name ?? `Test Run ${identifier}`}>
        <InlineLoader />
      </FeaturePageFrame>
    );
  }

  if (isError) {
    return (
      <FeaturePageFrame title="Test Run Details">
        <ErrorBanner message={error?.message ?? 'Failed to load test run'} />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame title={testRun?.name ?? `Test Run ${identifier}`}>
      <StepperHeader title="Test Run" subtitle={identifier} />
      {!isComparisonMode ? (
        <>
          <TestRunHeader {...headerProps} onOpenTestSet={handleOpenTestSet} onOpenEndpoint={handleOpenEndpoint} />

          <TestRunFilterBar
            filter={filter}
            onFilterChange={setFilter}
            availableBehaviors={shapedBehaviors.map((b) => ({ id: b.id, name: b.name }))}
            onDownload={handleDownload}
            onCompare={handleCompare}
            isDownloading={isDownloading}
            totalTests={shapedResults.length}
            filteredTests={filteredResults.length}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            <TestsList
              tests={filteredResults}
              selectedTestId={selectedTestId}
              onTestSelect={setSelectedTestId}
              prompts={shapedPrompts}
            />
            <TestDetailPanel
              test={selectedTest}
              prompts={shapedPrompts}
              behaviors={shapedBehaviors}
              testRunId={identifier}
              history={{
                rows: history,
                loading: historyLoading,
                onOpenRun: handleOpenRun,
                currentRunId: identifier,
              }}
            />
          </div>
        </>
      ) : (
        <ComparisonView
          currentTestRun={{
            id: testRun?.id ?? identifier,
            name: testRun?.name ?? undefined,
            created_at:
              testRun?.attributes?.started_at ??
              testRun?.created_at ??
              new Date().toISOString(),
          }}
          currentTestResults={shapedResults}
          availableTestRuns={availableTestRuns}
          onClose={() => setIsComparisonMode(false)}
          onLoadBaseline={loadBaselineResults}
          prompts={shapedPrompts}
          behaviors={shapedBehaviors}
        />
      )}
      <ActionBar primaryAction={null} />
    </FeaturePageFrame>
  );
}