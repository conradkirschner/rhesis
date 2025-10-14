'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useSession } from 'next-auth/react';
import { PageContainer } from '@toolpad/core/PageContainer';
import MetricsClientComponent from './components/MetricsClient';

export default function MetricsPage() {
  const { data: session, status } = useSession();
  const sessionToken = session?.session_token;
  const organizationId = session?.user?.organization_id

  if (status === 'loading') {
    return (
      <PageContainer
        title="Metrics"
        breadcrumbs={[{ title: 'Metrics', path: '/metrics' }]}
      >
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading metrics...</Typography>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  if (!sessionToken) {
    return (
      <PageContainer
        title="Metrics"
        breadcrumbs={[{ title: 'Metrics', path: '/metrics' }]}
      >
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Authentication required. Please log in.
          </Typography>
        </Box>
      </PageContainer>
    );
  }


  if (!organizationId) {
    return (
      <PageContainer
        title="Metrics"
        breadcrumbs={[{ title: 'Metrics', path: '/metrics' }]}
      >
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Organisation is required
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Metrics"
      breadcrumbs={[{ title: 'Metrics', path: '/metrics' }]}
    >
      <MetricsClientComponent
        organizationId={organizationId}
      />
    </PageContainer>
  );
}
