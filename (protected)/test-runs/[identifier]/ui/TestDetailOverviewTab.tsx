'use client';

import type { UiPromptMap, UiTestResult } from './types';

type Props = {
  test: UiTestResult;
  prompts: UiPromptMap;
};

export default function TestDetailOverviewTab({ test, prompts }: Props) {
  const promptContent = (test.promptId && prompts[test.promptId]?.content) || 'No prompt available';
  const responseContent = test.outputText || 'No response available';

  const metricValues = Object.values(test.metrics ?? {}) as Array<{ is_successful?: boolean | null }>;
  const overallPassed = metricValues.length > 0 && metricValues.every((m) => Boolean(m?.is_successful));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Test Result</h3>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: 16,
            background: overallPassed ? '#e8f5e9' : '#ffebee',
            color: overallPassed ? '#2e7d32' : '#c62828',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {overallPassed ? 'Passed' : 'Failed'}
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Prompt</div>
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fafafa', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {promptContent}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Response</div>
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fafafa', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {responseContent}
        </div>
      </div>
    </div>
  );
}