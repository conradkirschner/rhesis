'use client';

import type { UiBehavior, UiPromptMap, UiTestResult } from './types';
import TestDetailOverviewTab from './TestDetailOverviewTab';
import TestDetailMetricsTab from './TestDetailMetricsTab';
import TestDetailHistoryTab from './TestDetailHistoryTab';
import { useState } from 'react';

type Props = {
  test: UiTestResult | null;
  prompts: UiPromptMap;
  behaviors: ReadonlyArray<UiBehavior>;
  testRunId: string;
  history: {
    rows: Array<{
      id: string;
      testRunId: string;
      testRunName: string;
      passed: boolean;
      passedMetrics: number;
      totalMetrics: number;
      executedAt: string;
    }>;
    loading: boolean;
    onOpenRun: (runId: string) => void;
    currentRunId: string;
  };
};

export default function TestDetailPanel({ test, prompts, behaviors, testRunId, history }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  if (!test) {
    return (
      <div style={{ border: '1px solid #eee', borderRadius: 12, minHeight: 600, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Select a test from the list to view details
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, minHeight: 600, display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid #eee', display: 'flex' }}>
        {['Overview', 'Metrics', 'History'].map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(idx)}
            data-test-id={`tab-${label.toLowerCase()}`}
            style={{
              padding: '10px 14px',
              border: 'none',
              background: activeTab === idx ? '#e3f2fd' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && <TestDetailOverviewTab test={test} prompts={prompts} />}
        {activeTab === 1 && <TestDetailMetricsTab test={test} behaviors={behaviors} />}
        {activeTab === 2 && (
          <TestDetailHistoryTab
            rows={history.rows}
            loading={history.loading}
            currentRunId={history.currentRunId}
            onOpenRun={history.onOpenRun}
          />
        )}
      </div>
    </div>
  );
}