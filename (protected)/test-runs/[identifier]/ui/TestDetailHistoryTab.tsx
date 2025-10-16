'use client';

type Row = {
  id: string;
  testRunId: string;
  testRunName: string;
  passed: boolean;
  passedMetrics: number;
  totalMetrics: number;
  executedAt: string;
};

type Props = {
  rows: Row[];
  loading: boolean;
  currentRunId: string;
  onOpenRun: (runId: string) => void;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
}

export default function TestDetailHistoryTab({ rows, loading, currentRunId, onOpenRun }: Props) {
  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No historical data available for this test
        </div>
      </div>
    );
  }

  const passRate = (rows.filter((r) => r.passed).length / rows.length) * 100;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Last 10 test runs where this test was executed</div>
      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Test Run</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Metrics</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Executed At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{
                  background: r.testRunId === currentRunId ? 'rgba(25,118,210,0.08)' : 'transparent',
                  cursor: r.testRunId !== 'unknown' ? 'pointer' : 'default',
                }}
                onClick={() => r.testRunId !== 'unknown' && onOpenRun(r.testRunId)}
              >
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: r.testRunId === currentRunId ? '#1976d2' : '#111', fontWeight: r.testRunId === currentRunId ? 700 : 400 }}>
                      {r.testRunName}
                    </span>
                    {r.testRunId === currentRunId && (
                      <span style={{ padding: '2px 6px', borderRadius: 12, background: '#e3f2fd', color: '#1976d2', fontSize: 11 }}>Current</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: 10 }}>
                  {r.passedMetrics}/{r.totalMetrics} passed
                </td>
                <td style={{ padding: 10, color: '#666' }}>{fmtDate(r.executedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, border: '1px solid #eee', padding: 12, borderRadius: 8, display: 'flex', gap: 24 }}>
        <div>
          <div style={{ color: '#666', fontSize: 12 }}>Total Executions</div>
          <div style={{ fontWeight: 700 }}>{rows.length}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 12 }}>Pass Rate</div>
          <div style={{ fontWeight: 700, color: passRate >= 80 ? '#2e7d32' : '#c62828' }}>{passRate.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 12 }}>Passed</div>
          <div style={{ fontWeight: 700, color: '#2e7d32' }}>{rows.filter((r) => r.passed).length}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 12 }}>Failed</div>
          <div style={{ fontWeight: 700, color: '#c62828' }}>{rows.filter((r) => !r.passed).length}</div>
        </div>
      </div>
    </div>
  );
}