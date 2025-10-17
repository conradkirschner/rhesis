'use client';

import type { UiBehavior, UiTestResult } from './types';

type Props = {
  test: UiTestResult;
  behaviors: ReadonlyArray<UiBehavior>;
};

export default function TestDetailMetricsTab({ test, behaviors }: Props) {
  const testMetrics = test.metrics ?? {};
  const rows = behaviors.flatMap((b) =>
    b.metrics
      .map((m) => {
        const res = testMetrics[m.name];
        if (!res) return null;
        return {
          behaviorName: b.name,
          name: m.name,
          description: m.description,
          passed: Boolean(res.is_successful),
          reason: res.reason ?? '',
        };
      })
      .filter(Boolean),
  ) as Array<{ behaviorName: string; name: string; description?: string; passed: boolean; reason: string }>;

  const total = rows.length;
  const passed = rows.filter((r) => r.passed).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#666', fontSize: 12 }}>Overall Performance</div>
        <div style={{ fontWeight: 700, fontSize: 20 }}>{total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'}%</div>
        <div style={{ color: '#666', fontSize: 12 }}>{passed} of {total} metrics passed</div>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Behavior</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Metric</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#666' }}>
                  No metrics found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.behaviorName}-${r.name}`}>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: r.passed ? '#e8f5e9' : '#ffebee',
                        color: r.passed ? '#2e7d32' : '#c62828',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {r.passed ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 12 }}>{r.behaviorName}</span>
                  </td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: 10, color: r.reason ? '#222' : '#999', fontStyle: r.reason ? 'normal' : 'italic' }}>
                    {r.reason || 'No reason provided'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}