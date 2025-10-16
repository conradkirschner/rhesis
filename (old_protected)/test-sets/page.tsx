import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TestSetsGrid from './components/TestSetsGrid';
import TestSetsCharts from './components/TestSetsCharts';
import { auth } from '@/auth';
import { PageContainer } from '@toolpad/core/PageContainer';

import type {TestSet, TestSetDetail} from '@/api-client/types.gen';

import {
  readTestSetsTestSetsGet,
  readStatusStatusesStatusIdGet,
} from '@/api-client/sdk.gen';

/* ----------------------------- helper type guards ---------------------------- */

function isPaginatedList<T>(x: unknown): x is { data?: T[]; pagination?: { totalCount?: number } } {
  return typeof x === 'object' && x !== null && ('data' in (x as Record<string, unknown>) || 'pagination' in (x as Record<string, unknown>));
}

/* ---------------------------------- page ---------------------------------- */

export default async function TestSetsPage() {
    const session = await auth();
    const token = session?.session_token;

    if (!token) {
      throw new Error('No session token available');
    }

    const reqInit = {
      headers: { Authorization: `Bearer ${token}` },
      baseUrl: process.env.BACKEND_URL
    };

    // List test sets (server-side pagination)
    const listRaw = await readTestSetsTestSetsGet({
      query: {
        skip: 0,
        limit: 25,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      ...reqInit,
    });

    const testSets = listRaw.data?.data ?? [];
    const totalCount =  listRaw.data?.pagination?.totalCount ?? 0;

    // Hydrate status names (if status_id present)
    const testSetsWithStatus: TestSetDetail[] = await Promise.all(
        testSets.map(async (ts) => {
          if (!ts.status_id) return ts;

          try {
            const statusRaw = await readStatusStatusesStatusIdGet({
              path: { status_id: ts.status_id  },
              ...reqInit,
            });

            const statusObj = statusRaw.data;
            if (!statusObj) {
              return ts;
            }

            const name = statusObj.name

            // Provide a stable shape for the grid's status extractor
            return name ? ({ ...ts, status: { name } } as TestSetDetail) : ts;
          } catch {
            return ts; // If status fetch fails, keep the original row
          }
        }),
    );

    return (
        <PageContainer
            title="Test Sets"
            breadcrumbs={[{ title: 'Test Sets', path: '/test-sets' }]}
        >
          {/* Charts Section - Client Component */}
          <TestSetsCharts />

          {/* Table Section */}
          <Paper sx={{ width: '100%', mb: 2, mt: 2 }}>
            <Box sx={{ p: 2 }}>
              <TestSetsGrid
                  testSets={testSetsWithStatus}
                  loading={false}
                  initialTotalCount={totalCount}
              />
            </Box>
          </Paper>
        </PageContainer>
    );
}
