'use client';

import { useMemo } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { PageContainer } from '@toolpad/core';
import EndpointDetail from '../components/EndpointDetail';
import { useQuery } from '@tanstack/react-query';

import { readEndpointEndpointsEndpointIdGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type {Endpoint, EndpointDetail as EndpointDetailType } from '@/api-client/types.gen';

interface PageProps {
  params: Promise<{ identifier: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EndpointPage({ params }: PageProps) {
  const { identifier } = await params;

  // Build options with the generator helper (do NOT augment when calling useQuery)
  const queryOptions = useMemo(
      () =>
          readEndpointEndpointsEndpointIdGetOptions({
            path: { endpoint_id: identifier },
          }),
      [identifier]
  );

  // Call useQuery with the generated options directly
  const { data, isLoading, isFetching, error } = useQuery(queryOptions);

  const loading = isLoading || isFetching;
  const endpoint: EndpointDetailType | undefined = data;

  if (loading) {
    return (
        <Box
            sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
            }}
        >
          <CircularProgress size={24} />
          <Typography>Loading endpoint...</Typography>
        </Box>
    );
  }

  if (error) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">Error loading endpoint: {error.message}</Typography>
        </Box>
    );
  }

  if (!endpoint) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">No endpoint found</Typography>
        </Box>
    );
  }

  return (
      <PageContainer
          title={endpoint.name ?? 'Endpoint'}
          breadcrumbs={[
            { title: 'Endpoints', path: '/endpoints' },
            { title: endpoint.name ?? 'Details' },
          ]}
      >
        <Box sx={{ flexGrow: 1, pt: 3 }}>
            {endpoint.name ?? <EndpointDetail endpoint={endpoint as Endpoint} />}
        </Box>
      </PageContainer>
  );
}
