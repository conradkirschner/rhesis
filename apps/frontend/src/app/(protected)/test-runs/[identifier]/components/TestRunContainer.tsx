// apps/frontend/src/app/(protected)/test-runs/components/TestRunContainer.tsx
'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
/*TS2305: Module "@/hooks/data/TestRun/useTestRunData" has no exported member useTestRunHistory*/
import { useTestRunData, useTestRunHistory } from '@/hooks/data/TestRun/useTestRunData';
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

// --- Helpers: robustly coerce API/shape objects into UiTestResult & UiBehavior ---
function coerceToUiTestResult(item: any): UiTestResult {
  // Support both raw API and previously-shaped objects
  const id: string = item.id;
  const testId: string | undefined = item.testId ?? item.test_id ?? undefined;
  const promptId: string | undefined = item.promptId ?? item.prompt_id ?? undefined;
  const createdAt: string | undefined = item.createdAt ?? item.created_at ?? undefined;

  // Output text may live in different spots depending on origin
  const outputText: string =
      item.outputText ??
      item.test_output?.output ??
      item.output?.text ??
      '';

  // Metrics may already be present or under test_metrics.metrics
  const metrics: UiTestResult['metrics'] =
      item.metrics ??
      (item.test_metrics?.metrics as UiTestResult['metrics']) ??
      {};

  // Counts could be flat or nested
  const counts: NonNullable<UiTestResult['counts']> = {
    comments:
        (item.counts && item.counts.comments) ??
        item.commentsCount ??
        undefined,
    tasks:
        (item.counts && item.counts.tasks) ??
        item.tasksCount ??
        undefined,
  };

  // Tags: normalize to string[]
  const tags: string[] = Array.isArray(item.tags)
      ? item.tags
          .map((t: any) => (typeof t === 'string' ? t : t?.name ?? ''))
          .filter(Boolean)
      : [];

  return {
    id,
    testId,
    promptId,
    createdAt,
    outputText,
    metrics,
    counts,
    tags,
  };
}

function coerceBehaviorsToUi(behaviors: any[] | undefined): readonly UiBehavior[] {
  if (!Array.isArray(behaviors)) return [];
  return behaviors.map((b) => ({
    id: b.id,
    name: b.name,
    // UiBehavior expects description?: string | undefined (no nulls)
    description: b.description ?? undefined,
    metrics: Array.isArray(b.metrics)
        ? b.metrics.map((m: any) => ({
          name: m.name,
          description: m.description ?? undefined,
        }))
        : [],
  })) as readonly UiBehavior[];
}

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

  // ✅ Fix: normalize behaviors to UiBehavior (no null in description)
  const shapedBehaviors: readonly UiBehavior[] = useMemo(
      () => coerceBehaviorsToUi(behaviors),
      [behaviors],
  );

  // ✅ Central mapping for test results
  const shapedResults: readonly UiTestResult[] = useMemo(() => {
    return (testResults ?? []).map(coerceToUiTestResult);
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

  // ✅ Fix: adapt `loadBaselineResults` to return UiTestResult[]
  const handleLoadBaseline = useCallback(
      async (testRunId: string): Promise<UiTestResult[]> => {
        const raw = await loadBaselineResults(testRunId);
        return (raw ?? []).map(coerceToUiTestResult);
      },
      [loadBaselineResults],
  );

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
              <TestRunHeader
                  {...headerProps}
                  onOpenTestSet={handleOpenTestSet}
                  onOpenEndpoint={handleOpenEndpoint}
              />

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
                onLoadBaseline={handleLoadBaseline}
                prompts={shapedPrompts}
                behaviors={shapedBehaviors}
            />
        )}
        <ActionBar primaryAction={null} />
      </FeaturePageFrame>
  );
}
