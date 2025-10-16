'use client';

import * as React from 'react';
import { Box, Grid, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material';
import type { UiTasksStatsProps } from '../types';

const StatCard = ({
  title,
  value,
  loading,
  color,
}: {
  readonly title: string;
  readonly value: number;
  readonly loading: boolean;
  readonly color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom variant="h6">
        {title}
      </Typography>
      <Typography variant="h4" sx={color ? (t) => ({ color: t.palette[color].main }) : undefined}>
        {loading ? '…' : value}
      </Typography>
    </CardContent>
  </Card>
);

export default function StepStats(props: UiTasksStatsProps) {
  const { total, open, inProgress, completed, cancelled, loading, updating, errorMessage } = props;

  return (
    <Box sx={{ px: 3, pb: 2 }}>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {updating && !loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Updating…
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Total" value={total} loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Open" value={open} loading={loading} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="In Progress" value={inProgress} loading={loading} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Completed" value={completed} loading={loading} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Cancelled" value={cancelled} loading={loading} color="error" />
        </Grid>
      </Grid>
    </Box>
  );
}