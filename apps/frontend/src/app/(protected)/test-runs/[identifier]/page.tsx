// app/test-runs/[identifier]/page.tsx
'use server';

import { Box, Typography, Button, Paper } from '@mui/material';
import { Metadata } from 'next';
import { PageContainer } from '@toolpad/core/PageContainer';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { auth } from '@/auth';

// Generated SDK + types
import type {
  TestRunDetail,
  TestResultDetail,
  Prompt,
  Behavior,
  Metric,
} from '@/api-client/types.gen';

import {
  readTestRunTestRunsTestRunIdGet,
  readPromptPromptsPromptIdGet,
  readTestResultsTestResultsGet,
  getTestRunBehaviorsTestRunsTestRunIdBehaviorsGet,
  readBehaviorMetricsBehaviorsBehaviorIdMetricsGet,
} from '@/api-client/sdk.gen';

import TestRunMainView from './components/TestRunMainView';

type PageProps = {
  params: { identifier: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

/** ---- Helpers to normalize SDK responses ---- */
function unwrapList<T>(res: any): T[] {
  // Accept common shapes:
  // 1) { data: T[]; pagination?: ... }
  // 2) { data: { data: T[]; pagination?: ... } }
  // 3) T[]
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res?.data)) return res.data as T[];
  if (Array.isArray(res?.data?.data)) return res.data.data as T[];
  return [];
}

function unwrapOne<T>(res: any): T | undefined {
  // Accept common shapes:
  // 1) { data: T }
  // 2) T
  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data as T;
  }
  if (res && typeof res === 'object' && !Array.isArray(res)) {
    return res as T;
  }
  return undefined;
}

function isDefined<T>(x: T | undefined | null): x is T {
  return x != null;
}

/* -------------------- Metadata -------------------- */

export async function generateMetadata(
    { params }: { params: { identifier: string } },
): Promise<Metadata> {
  const { identifier } = params ?? { identifier: '' };
  return {
    title: `Test Run | ${identifier}`,
    description: `Details for Test Run ${identifier}`,
    openGraph: {
      title: `Test Run | ${identifier}`,
      description: `Details for Test Run ${identifier}`,
    },
  };
}

/* -------------------- Page -------------------- */

export default async function TestRunPage({ params }: PageProps) {
  try {
    const { identifier } = params;
    const session = await auth();

    if (!session?.session_token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${session.session_token}` };
    const baseUrl = process.env.BACKEND_URL;

    // 1) Test run (unwrap the single entity)
    const testRun = unwrapOne<TestRunDetail>(
        await readTestRunTestRunsTestRunIdGet({
          headers,
          baseUrl,
          path: { test_run_id: identifier },
        }),
    );

    if (!testRun) {
      throw new Error('Test run not found');
    }

    // 2) Test results (paged)
    const batchSize = 100;
    let allResults: TestResultDetail[] = [];
    let skip = 0;
    let totalCount: number | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await readTestResultsTestResultsGet({
        headers,
        baseUrl,
        query: {
          $filter: `test_run_id eq '${identifier}'`,
          limit: batchSize,
          skip,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
      });

      const data = unwrapList<TestResultDetail>(page);
      allResults = allResults.concat(data);

      const pagination = (page as any)?.pagination as
          | { totalCount?: number }
          | { data?: { totalCount?: number } }
          | undefined;

      if (typeof (pagination as any)?.totalCount === 'number') {
        totalCount = (pagination as any).totalCount;
      } else if (typeof (page as any)?.data?.pagination?.totalCount === 'number') {
        totalCount = (page as any).data.pagination.totalCount;
      }

      if (totalCount !== undefined) {
        if (allResults.length >= totalCount) break;
      } else {
        if (data.length < batchSize) break;
      }

      skip += batchSize;
      if (skip > 10_000) break; // safety
    }

    // 3) Prompts (dedup + fetch)
    const promptIds = Array.from(
        new Set(
            allResults
                .map((r) => r.prompt_id)
                .filter((id): id is string => Boolean(id)),
        ),
    );

    const promptSettled = await Promise.allSettled(
        promptIds.map((id) =>
            readPromptPromptsPromptIdGet({
              headers,
              baseUrl,
              path: { prompt_id: id },
            }),
        ),
    );

    const promptsMap = promptSettled.reduce<Record<string, Prompt>>(
        (acc, result, idx) => {
          const id = promptIds[idx];
          if (result.status === 'fulfilled') {
            const prompt = unwrapOne<Prompt>(result.value);
            if (prompt) acc[id] = prompt;
          }
          return acc;
        },
        {},
    );

    // 4) Behaviors with metrics (always give Metric[])
    const behaviorsRes = await getTestRunBehaviorsTestRunsTestRunIdBehaviorsGet({
      headers,
      baseUrl,
      path: { test_run_id: identifier },
    });

    const rawBehaviors = unwrapList<Behavior>(behaviorsRes);

    const withMetrics = await Promise.all(
        rawBehaviors.map(async (b): Promise<(Behavior & { metrics: Metric[] }) | undefined> => {
          if (!b.id) return undefined;
          try {
            const metricsRes = await readBehaviorMetricsBehaviorsBehaviorIdMetricsGet({
              headers,
              baseUrl,
              path: { behavior_id: b.id },
            });
            const metricsArray = unwrapList<Metric>(metricsRes);
            return { ...b, metrics: metricsArray };
          } catch {
            // If metrics cannot be fetched, still return behavior with empty metrics array
            return { ...b, metrics: [] };
          }
        }),
    );

    // Remove undefined (no id) and keep only those with metrics (if that's required)
    const behaviors: Array<Behavior & { metrics: Metric[] }> = withMetrics
        .filter(isDefined)
        .map((b) => ({ ...b, metrics: b.metrics ?? [] })); // guarantee Metric[]

    const title = testRun.name || `Test Run ${identifier}`;
    const breadcrumbs = [
      { title: 'Test Runs', path: '/test-runs' },
      { title, path: `/test-runs/${identifier}` },
    ];

    return (
        <PageContainer title={title} breadcrumbs={breadcrumbs}>
          <Box sx={{ flexGrow: 1, pt: 3 }}>
            <TestRunMainView
                testRunId={identifier}
                testRunData={{
                  id: testRun.id,
                  name: testRun.name?? '',
                  created_at: testRun.attributes?.started_at || testRun.created_at || '',
                  test_configuration_id: testRun.test_configuration_id,
                }}
                testRun={testRun}
                testResults={allResults}
                prompts={
                  promptsMap as Record<string, { content: string; name?: string }>
                }
                behaviors={
                  behaviors.map((b) => ({
                    id: b.id,
                    name: b.name,
                    description: b.description ?? undefined,
                    metrics: (b.metrics ?? []).map((m) => ({
                      name: m.name,
                      description: m.description ?? undefined,
                    })),
                  })) as Array<{
                    id: string;
                    name: string;
                    description?: string;
                    metrics: Array<{ name: string; description?: string }>;
                  }>
                }
                currentUserId={session.user?.id || ''}
                currentUserName={session.user?.name || ''}
                currentUserPicture={session.user?.picture || undefined}
            />
          </Box>
        </PageContainer>
    );
  } catch (error) {
    const message = (error as Error)?.message || 'Unknown error';
    return (
        <PageContainer
            title="Test Run Details"
            breadcrumbs={[{ title: 'Test Runs', path: '/test-runs' }]}
        >
          <Paper sx={{ p: 3 }}>
            <Typography color="error">
              Error loading test run details: {message}
            </Typography>
            <Button
                component={Link}
                href="/test-runs"
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 2 }}
            >
              Back to Test Runs
            </Button>
          </Paper>
        </PageContainer>
    );
  }
}
