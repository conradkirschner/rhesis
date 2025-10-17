'use client';

import { useMemo } from 'react';
import type { UiTestRunHeaderProps } from './types';

function formatDate(d?: string) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleString();
}

export default function TestRunHeader(props: UiTestRunHeaderProps) {
  const { testRun, testResults, onOpenEndpoint, onOpenTestSet } = props;

  const stats = useMemo(() => {
    const total = testResults.length;
    const passed = testResults.filter((r) => {
      const values = Object.values(r.metrics ?? {});
      return values.length > 0 && values.every((m) => m?.is_successful);
    }).length;
    const failed = Math.max(total - passed, 0);
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    let duration = 'N/A';
    if (testRun.startedAt && testRun.completedAt) {
      const start = new Date(testRun.startedAt).getTime();
      const end = new Date(testRun.completedAt).getTime();
      const diff = Math.max(end - start, 0);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      duration = `${mins}m ${secs}s`;
    } else if (testRun.startedAt && !testRun.completedAt) {
      duration = 'In Progress';
    }

    return { total, passed, failed, passRate, duration };
  }, [testRun.startedAt, testRun.completedAt, testResults]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16 }}>
      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Pass Rate</div>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.passRate}%</div>
        <div style={{ color: '#666', fontSize: 12 }}>{stats.passed} of {stats.total} tests</div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Tests Executed</div>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.total}</div>
        <div style={{ color: '#666', fontSize: 12 }}>{stats.passed} passed, {stats.failed} failed</div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Duration</div>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.duration}</div>
        <div style={{ color: '#666', fontSize: 12 }}>{formatDate(testRun.startedAt)}</div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>Links</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenTestSet}
            data-test-id="open-test-set"
            disabled={!testRun.testConfiguration?.testSet?.id}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
          >
            {testRun.testConfiguration?.testSet?.name ?? 'Test Set'}
          </button>
          <button
            type="button"
            onClick={onOpenEndpoint}
            data-test-id="open-endpoint"
            disabled={!testRun.testConfiguration?.endpoint?.id}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
          >
            Endpoint: {testRun.testConfiguration?.endpoint?.name ?? testRun.environment ?? 'N/A'}
          </button>
        </div>
      </div>
    </div>
  );
}