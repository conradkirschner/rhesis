'use client';

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { GridPaginationModel } from '@mui/x-data-grid';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import EndpointsGrid from './components/EndpointsGrid';

// Generated HeyAPI + TanStack v5 helpers & types
import { readEndpointsEndpointsGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type {
  PaginatedEndpointDetail,
  EndpointDetail,
  Endpoint,
} from '@/api-client/types.gen';

export default function EndpointsPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  // Build generated query options
  const endpointsQueryOptions = useMemo(
      () =>
          readEndpointsEndpointsGetOptions({
            query: {
              skip,
              limit,
              sort_by: 'created_at',
              sort_order: 'desc',
            },
          }),
      [skip, limit]
  );

  const {
    data,
    isLoading,
    error: rqError,
  } = useQuery({
    ...endpointsQueryOptions,
    enabled: status !== 'loading' && !!session?.session_token,
  });

  // API returns EndpointDetail[] with optional name — coerce to Endpoint[] by defaulting name
  const endpoints: Endpoint[] = useMemo(() => {
    const rows = (data as PaginatedEndpointDetail | undefined)?.data ?? [];
    // Only normalize what's necessary to satisfy Endpoint (name must be string)
    return (rows as EndpointDetail[]).map((e) => ({
      ...e,
      name: e.name ?? '', // <-- fix: ensure required string
    })) as Endpoint[];
  }, [data]);

  const totalCount = useMemo(() => {
    const p = (data as PaginatedEndpointDetail | undefined)?.pagination;
    // support either `totalCount` or `total`
    return (p && (('totalCount' in p && p.totalCount))) || 0;
  }, [data]);

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  };

  const handleEndpointDeleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: endpointsQueryOptions.queryKey });
  }, [queryClient, endpointsQueryOptions.queryKey]);

  if (status === 'loading') {
    return (
        <Box sx={{ p: 3 }}>
          <Typography>Loading session…</Typography>
        </Box>
    );
  }

  if (!session?.session_token) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">Authentication required. Please log in.</Typography>
        </Box>
    );
  }

  const errorMessage =
      rqError ? rqError.message : null;

  if (errorMessage) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">Error loading endpoints: {errorMessage}</Typography>
        </Box>
    );
  }

  return (
      <PageContainer title="Endpoints" breadcrumbs={[{ title: 'Endpoints' }]}>
        <EndpointsGrid
            endpoints={endpoints}
            loading={isLoading}
            totalCount={totalCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            onEndpointDeleted={handleEndpointDeleted}
        />
      </PageContainer>
  );
}
