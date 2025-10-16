import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { auth } from '@/auth';
import { PageContainer } from '@toolpad/core/PageContainer';
import TestResultsDashboard from './components/TestResultsDashboard';
import { redirect } from 'next/navigation';

export default async function TestResultsPage() {
  try {
    const session = await auth();

    if (!session?.session_token) {
      return redirect('/login');
    }

    return (
      <PageContainer
        title="Test Results"
        breadcrumbs={[{ title: 'Test Results', path: '/test-results' }]}
      >
        <TestResultsDashboard/>
      </PageContainer>
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    return (
      <PageContainer title="Test Results">
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading Test Results
          </Typography>
          <Typography color="text.secondary">{errorMessage}</Typography>
        </Paper>
      </PageContainer>
    );
  }
}
