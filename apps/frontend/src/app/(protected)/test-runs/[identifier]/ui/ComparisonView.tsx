// apps/frontend/src/app/(protected)/test-runs/[identifier]/ui/ComparisonView.tsx
'use client';

import type { UiBehavior, UiPromptMap, UiTestResult } from './types';
import { useCallback, useEffect, useMemo, useState } from 'react';

type AvailableRun = { id: string; name?: string; created_at: string; pass_rate?: number };

type Props = {
  currentTestRun: { id: string; name?: string; created_at: string };
  currentTestResults: ReadonlyArray<UiTestResult>;
  availableTestRuns: ReadonlyArray<AvailableRun>;
  onClose: () => void;
  onLoadBaseline: (testRunId: string) => Promise<UiTestResult[]>;
  prompts: UiPromptMap;
  behaviors: ReadonlyArray<UiBehavior>;
};

export default function ComparisonView({
                                         currentTestRun,
                                         currentTestResults,
                                         availableTestRuns,
                                         onClose,
                                         onLoadBaseline,
                                         prompts,
                                         behaviors,
                                       }: Props) {
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>(availableTestRuns[0]?.id || '');
  const [baselineResults, setBaselineResults] = useState<UiTestResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'improved' | 'regressed' | 'unchanged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isPassed = useCallback((t: UiTestResult) => {
    const vals = Object.values(t.metrics ?? {});
    const total = vals.length;
    const passed = vals.filter((m) => Boolean(m?.is_successful)).length;
    return total > 0 && passed === total;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedBaselineId) {
        setBaselineResults(null);
        return;
      }
      setLoading(true);
      try {
        const data = await onLoadBaseline(selectedBaselineId);
        if (!cancelled) setBaselineResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedBaselineId, onLoadBaseline]);

  const pairs = useMemo(() => {
    if (!baselineResults) return [];
    return currentTestResults.map((c, idx) => {
      const b = baselineResults.find((x) => x.promptId && x.promptId === c.promptId) ?? baselineResults[idx];
      return { id: c.id, baseline: b, current: c };
    });
  }, [baselineResults, currentTestResults]);

  const list = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pairs.filter((p) => {
      if (statusFilter !== 'all') {
        const b = p.baseline ? isPassed(p.baseline) : null;
        const c = isPassed(p.current);
        const improved = b !== null && c && !b;
        const regressed = b !== null && !c && b;
        const unchanged = !improved && !regressed;
        if (statusFilter === 'improved' && !improved) return false;
        if (statusFilter === 'regressed' && !regressed) return false;
        if (statusFilter === 'unchanged' && !unchanged) return false;
      }
      if (!q) return true;
      const pid = p.current.promptId;
      const promptText = pid && prompts[pid]?.content ? prompts[pid].content.toLowerCase() : '';
      const respText = (p.current.outputText ?? '').toLowerCase();
      return promptText.includes(q) || respText.includes(q);
    });
  }, [pairs, statusFilter, searchQuery, isPassed, prompts]);

  const baselineRun = useMemo(
      () => availableTestRuns.find((r) => r.id === selectedBaselineId),
      [availableTestRuns, selectedBaselineId],
  );

  const getPromptSnippet = (t: UiTestResult, max = 80) => {
    const pid = t.promptId;
    const content = pid && prompts[pid]?.content ? prompts[pid].content : '';
    if (!content) return `Test #${t.id.slice(0, 8)}`;
    return content.length <= max ? content : content.slice(0, max).trim() + '…';
  };

  const currentPassRate = useMemo(() => {
    const passed = currentTestResults.filter(isPassed).length;
    return Math.round((passed / Math.max(1, currentTestResults.length)) * 100);
  }, [currentTestResults, isPassed]);

  const baselinePassRate = useMemo(() => {
    if (!baselineResults?.length) return undefined;
    const passed = baselineResults.filter(isPassed).length;
    return Math.round((passed / Math.max(1, baselineResults.length)) * 100);
  }, [baselineResults, isPassed]);

  if (loading && !baselineResults) {
    return (
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Run Comparison</h3>
            <button type="button" onClick={onClose} data-test-id="close-compare">Close</button>
          </div>
          Loading comparison data…
        </div>
    );
  }

  return (
      <div style={{ paddingBottom: 24 }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Run Comparison</h3>
          <button type="button" onClick={onClose} data-test-id="close-compare">Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Baseline Run</div>
            <select
                value={selectedBaselineId}
                onChange={(e) => setSelectedBaselineId(e.target.value)}
                data-test-id="baseline-select"
                style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', width: '100%', marginBottom: 8 }}
            >
              {availableTestRuns.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.name ?? `Run #${r.id.slice(0, 8)}`)} — {new Date(r.created_at).toLocaleDateString()}
                  </option>
              ))}
            </select>
            {baselineRun && baselinePassRate !== undefined && (
                <div style={{ color: '#666', fontSize: 12 }}>Pass rate: <b>{baselinePassRate}%</b></div>
            )}
          </div>

          <div style={{ border: '1px solid #1976d2', borderRadius: 12, padding: 16, background: '#e3f2fd' }}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Current Run</div>
            <div style={{ fontWeight: 600 }}>{currentTestRun.name ?? `Run #${currentTestRun.id.slice(0, 8)}`}</div>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
              {new Date(currentTestRun.created_at).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{ color: '#666', fontSize: 12 }}>Pass rate:</span>
              <b>{currentPassRate}%</b>
              {baselinePassRate !== undefined && (
                  <span style={{ fontSize: 12, color: currentPassRate > baselinePassRate ? '#2e7d32' : currentPassRate < baselinePassRate ? '#c62828' : '#666' }}>
                ({currentPassRate > baselinePassRate ? '+' : ''}
                    {(currentPassRate - baselinePassRate).toFixed(1)}%)
              </span>
              )}
            </div>
          </div>
        </div>

        {baselineResults && (
            <>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search tests…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', minWidth: 240 }}
                />
                {(['all', 'improved', 'regressed', 'unchanged'] as const).map((k) => (
                    <button
                        key={k}
                        type="button"
                        onClick={() => setStatusFilter(k)}
                        data-test-id={`status-${k}`}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #ccc',
                          background: statusFilter === k ? '#1976d2' : 'white',
                          color: statusFilter === k ? 'white' : 'black',
                          cursor: 'pointer',
                        }}
                    >
                      {k[0].toUpperCase() + k.slice(1)}
                    </button>
                ))}
                <span style={{ color: '#666', fontSize: 12 }}>{list.length} tests</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh', overflow: 'auto' }}>
                {list.map((p) => {
                  const bPassed = p.baseline ? isPassed(p.baseline) : null;
                  const cPassed = isPassed(p.current);
                  const bVals = p.baseline ? Object.values(p.baseline.metrics ?? {}) : [];
                  const cVals = Object.values(p.current.metrics ?? {});
                  const bCount = bVals.filter((m) => m?.is_successful).length;
                  const cCount = cVals.filter((m) => m?.is_successful).length;
                  const improved = bPassed !== null && cPassed && !bPassed;
                  const regressed = bPassed !== null && !cPassed && bPassed;

                  return (
                      <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                          <div style={{ padding: 16, borderRight: '1px solid #eee' }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{getPromptSnippet(p.current)}</div>
                            <div style={{ fontSize: 12 }}>
                              {bPassed !== null ? (bPassed ? 'Passed' : 'Failed') : 'No data'}{' '}
                              {bPassed !== null && `(${bCount}/${bVals.length})`}
                            </div>
                          </div>
                          <div
                              style={{
                                padding: 16,
                                background: improved ? 'rgba(46,125,50,0.08)' : regressed ? 'rgba(198,40,40,0.08)' : 'transparent',
                              }}
                          >
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <div style={{ fontWeight: 600 }}>{getPromptSnippet(p.current)}</div>
                              {improved && <span style={{ fontSize: 12, color: '#2e7d32' }}>▲</span>}
                              {regressed && <span style={{ fontSize: 12, color: '#c62828' }}>▼</span>}
                            </div>
                            <div style={{ fontSize: 12 }}>
                              {cPassed ? 'Passed' : 'Failed'} ({cCount}/{cVals.length})
                            </div>
                          </div>
                        </div>
                      </div>
                  );
                })}
              </div>
            </>
        )}
      </div>
  );
}
