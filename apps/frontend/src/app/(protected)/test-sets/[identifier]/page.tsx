import TestSetDetailCharts from './components/TestSetDetailCharts';
import TestSetTestsGrid from './components/TestSetTestsGrid';
import TestSetDetailsSection from './components/TestSetDetailsSection';
import { TasksAndCommentsWrapper } from '@/components/tasks/TasksAndCommentsWrapper';
import { auth } from '@/auth';
import { Box, Grid, Paper } from '@mui/material';
import type { Metadata } from 'next';
import { PageContainer } from '@toolpad/core/PageContainer';

import type { TestSet } from '@/api-client/types.gen';
import { readTestSetTestSetsTestSetIdentifierGet } from '@/api-client/sdk.gen';

async function getTestSetById(identifier: string, token: string) {
  const resp = await readTestSetTestSetsTestSetIdentifierGet({
    path: { test_set_identifier: identifier },
    headers: { Authorization: `Bearer ${token}` },
    baseUrl: process.env.BACKEND_URL,
  });

  const testSet = resp?.data;
  return (testSet ?? null) as TestSet | null;
}

/* ------------------------------ page metadata ----------------------------- */

export async function generateMetadata({
                                         params,
                                       }: {
  params: Promise<{ identifier: string }>;
}): Promise<Metadata> {
  const { identifier } = await params;
  const session = (await auth());

  if (!session?.session_token) {
    return {
      title: `Test Set | ${identifier}`,
      description: `Details for Test Set ${identifier}`,
    };
  }

  const testSet = await getTestSetById(identifier, session.session_token);
  if (!testSet) {
    return {
      title: `Test Set | ${identifier}`,
      description: `Details for Test Set ${identifier}`,
    };
  }

  return {
    title: testSet.name ?? `Test Set | ${identifier}`,
    description: testSet.description ?? 'Test Set Details',
    openGraph: {
      title: testSet.name ?? `Test Set | ${identifier}`,
      description: testSet.description ?? 'Test Set Details',
    },
  };
}

/* ---------------------------------- page ---------------------------------- */

export default async function TestSetPage({
                                            params,
                                          }: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  const session = (await auth());

  if (!session?.session_token) {
    throw new Error('Authentication required');
  }

  const testSet = await getTestSetById(identifier, session.session_token);
  if (!testSet) {
    throw new Error('Test set not found');
  }

  const title = testSet.name ?? `Test Set ${identifier}`;
  const breadcrumbs = [
    { title: 'Test Sets', path: '/test-sets' },
    { title, path: `/test-sets/${identifier}` },
  ];

  if (!testSet.id) {
    throw new Error("TestSet not Found")
  }
  return (
      <PageContainer title={title} breadcrumbs={breadcrumbs}>
        <Box sx={{ flexGrow: 1, pt: 3 }}>
          {/* Charts Section */}
          <Box sx={{ mb: 4 }}>
            <TestSetDetailCharts
                testSetId={identifier}
                sessionToken={session.session_token}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <TestSetDetailsSection
                    testSet={testSet}
                    sessionToken={session.session_token}
                />
              </Paper>

              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <TestSetTestsGrid
                    testSetId={identifier}
                />
              </Paper>

              <TasksAndCommentsWrapper
                  entityType="TestSet"
                  entityId={testSet.id}
                  currentUserId={session.user?.id ?? ''}
                  currentUserName={session.user?.name ?? ''}
                  currentUserPicture={session.user?.picture ?? undefined}
              />
            </Grid>
          </Grid>
        </Box>
      </PageContainer>
  );
}
