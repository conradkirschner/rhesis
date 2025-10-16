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
    const passed = currentTestR