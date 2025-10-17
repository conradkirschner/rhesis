'use client';

import type { UiPromptMap, UiTestResult } from './types';
import { useCallback, useEffect, useMemo, useRef } from 'react';

type Props = {
  tests: ReadonlyArray<UiTestResult>;
  selectedTestId: string | null;
  onTestSelect: (id: string) => void;
  prompts: UiPromptMap;
};

export default function TestsList({ tests, selectedTestId, onTestSelect, prompts }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    return tests.map((t) => {
      const metrics = t.metrics ?? {};
      const vals = Object.values(metrics);
      const passed = vals.filter((m) => m?.is_successful).length;
      const total = vals.length;
      const isPassed = total > 0 && passed === total;

      const promptContent = (t.promptId && prompts[t.promptId]?.content) || 'No prompt available';

      return { test: t, isPassed, passed, total, promptContent };
    });
  }, [tests, prompts]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!items.length) return;
      const idx = items.findIndex((i) => i.test.id === selectedTestId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = idx < items.length - 1 ? idx + 1 : 0;
        onTestSelect(items[next].test.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : items.length - 1;
        onTestSelect(items[prev].test.id);
      }
    },
    [items, selectedTestId, onTestSelect],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedTestId]);

  return (
    <div
      ref={listRef}
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 8,
        height: 'calc(100vh - 420px)',
        minHeight: 400,
        overflow: 'auto',
      }}
      aria-label="Test results"
    >
      {items.map(({ test, isPassed, passed, total, promptContent }) => {
        const selected = selectedTestId === test.id;
        const truncated = promptContent.length > 100 ? `${promptContent.slice(0, 100)}…` : promptContent;

        return (
          <div key={test.id} ref={selected ? selectedRef : null} style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => onTestSelect(test.id)}
              aria-pressed={selected}
              data-test-id={`test-item-${test.id}`}
              style={{
                width: '100%',
                textAlign: 'left',
                borderRadius: 12,
                border: `2px solid ${selected ? '#1976d2' : 'transparent'}`,
                background: 'white',
                padding: 12,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div
                  aria-label={isPassed ? 'Passed' : 'Failed'}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: isPassed ? '#2e7d32' : '#c62828',
                    marginTop: 6,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{truncated}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, fontSize: 12 }}>
                    <span style={{ color: isPassed ? '#2e7d32' : '#c62828' }}>
                      {passed}/{total} metrics
                    </span>
                    {typeof test.counts?.comments === 'number' && <span>💬 {test.counts.comments}</span>}
                    {typeof test.counts?.tasks === 'number' && <span>🗒 {test.counts.tasks}</span>}
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}