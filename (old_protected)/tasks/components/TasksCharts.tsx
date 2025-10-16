'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';

import type { PaginatedTaskDetail } from '@/api-client/types.gen';
import { listTasksTasksGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface TasksChartsProps {
  sessionToken: string;
}

const PAGE_SIZE = 100;

type PaletteKey =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info';

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function TasksCharts({ sessionToken }: TasksChartsProps) {
  const tasksQuery = useQuery({
    ...listTasksTasksGetOptions({
      headers: { Authorization: `Bearer ${sessionToken}` },
      query: { skip: 0, limit: PAGE_SIZE },
    }),
    enabled: Boolean(sessionToken),
    staleTime: 60_000,
  });

  const loading = tasksQuery.isLoading || tasksQuery.isFetching;
  const page: PaginatedTaskDetail | undefined = tasksQuery.data;

  const stats = React.useMemo<Stats>(() => {
    const tasks = page?.data ?? [];

    const byStatus = (name: string) =>
        tasks.filter((t) => t.status?.name === name).length;

    return {
      total: page?.pagination?.totalCount ?? tasks.length,
      open: byStatus('Open'),
      inProgress: byStatus('In Progress'),
      completed: byStatus('Completed'),
      cancelled: byStatus('Cancelled'),
    };
  }, [page]);

  const colorFromPalette =
      (key: PaletteKey) =>
          (theme: Theme): string =>
              theme.palette[key].main;

  const StatCard: React.FC<{ title: string; value: number; color?: PaletteKey }> =
      ({ title, value, color = 'primary' }) => (
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                {title}
              </Typography>
              <Typography variant="h4" sx={{ color: colorFromPalette(color) }}>
                {loading ? '…' : value}
              </Typography>
            </CardContent>
          </Card>
      );

  return (
      <Box sx={{ mb: 3 }}>
        {tasksQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {tasksQuery.error.message}
            </Alert>
        )}

        {tasksQuery.isFetching && !tasksQuery.isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Updating…
              </Typography>
            </Box>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <StatCard title="Total" value={stats.total} />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <StatCard title="Open" value={stats.open} color="warning" />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <StatCard title="In Progress" value={stats.inProgress} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <StatCard title="Completed" value={stats.completed} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <StatCard title="Cancelled" value={stats.cancelled} color="error" />
          </Grid>
        </Grid>
      </Box>
  );
}
