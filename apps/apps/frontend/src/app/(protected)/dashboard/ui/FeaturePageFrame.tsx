'use client';

import * as React from 'react';
import { Box, Grid, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Pagination, useTheme } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import { BaseChartsGrid, BaseLineChart, BasePieChart } from '@/components/common/BaseCharts';
import { Science as ScienceMUI, PlayArrow, HorizontalSplit } from '@mui/icons-material';
import InlineLoader from './InlineLoader';
import ErrorBanner from './ErrorBanner';
import type { UiDashboardViewProps, UiTestRow, UiTestSetRow } from './types';

function SectionCard(props: { readonly title: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{props.title}</Typography>
      {props.children}
    </Paper>
  );
}

function RowsTable<T extends { id: string }>(props: {
  readonly rows: readonly T[];
  readonly columns: ReadonlyArray<{ readonly key: keyof T; readonly label: string; readonly width?: string | number; readonly render?: (row: T) => React.ReactNode }>;
  readonly pagination: { readonly page: number; readonly pageSize: number };
  readonly totalRows: number;
  readonly onChangePagination: (page: number, pageSize: number) => void;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly testId: string;
}) {
  const pageCount = Math.max(1, Math.ceil(props.totalRows / Math.max(1, props.pagination.pageSize)));

  return (
    <Box>
      {props.loading ? <InlineLoader /> : null}
      {props.error ? <ErrorBanner message={props.error} /> : null}
      <Box sx={{ overflowX: 'auto' }} data-test-id={`${props.testId}-table`}>
        <Table size="small" aria-label={props.testId}>
          <TableHead>
            <TableRow>
              {props.columns.map((c) => (
                <TableCell key={String(c.key)} sx={{ width: c.width }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {props.rows.map((row) => (
              <TableRow key={row.id} hover>
                {props.columns.map((c) => (
                  <TableCell key={String(c.key)}>
                    {c.render ? c.render(row) : String(row[c.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Rows per page</Typography>
          <Select
            size="small"
            value={props.pagination.pageSize}
            onChange={(e) => props.onChangePagination(0, Number(e.target.value))}
            data-test-id={`${props.testId}-page-size`}
          >
            {[10, 25, 50].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </Box>
        <Pagination
          count={pageCount}
          page={props.pagination.page + 1}
          onChange={(_e, p) => props.onChangePagination(p - 1, props.pagination.pageSize)}
          size="small"
          showFirstButton
          showLastButton
          data-test-id={`${props.testId}-pagination`}
        />
      </Box>
    </Box>
  );
}

export default function FeaturePageFrame(props: UiDashboardViewProps) {
  const theme = useTheme();

  return (
    <PageContainer>
      {/* Charts */}
      {props.charts.isLoading ? <InlineLoader /> : null}
      {props.charts.error ? <ErrorBanner message={props.charts.error} /> : null}
      {!props.charts.isLoading && !props.charts.error ? (
        <BaseChartsGrid columns={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
          <BaseLineChart
            title="Cumulative Tests"
            data={props.charts.data.testCasesData}
            series={[{ dataKey: 'total', name: 'Total Test Cases' }]}
            useThemeColors
            colorPalette="line"
            height={180}
          />
          <BaseLineChart
            title="Test Execution Trend"
            data={props.charts.data.testExecutionTrendData}
            series={[
              { dataKey: 'tests', name: 'Total Tests', color: theme.palette.primary.main },
              { dataKey: 'passed', name: 'Passed Tests', color: theme.palette.success.main },
              { dataKey: 'failed', name: 'Failed Tests', color: theme.palette.error.main },
            ]}
            useThemeColors={false}
            colorPalette="line"
            height={180}
          />
          <BasePieChart
            title="Tests Behavior Distribution"
            data={props.charts.data.behaviorData}
            useThemeColors
            colorPalette="pie"
          />
          <BasePieChart
            title="Tests Category Distribution"
            data={props.charts.data.categoryData}
            useThemeColors
            colorPalette="pie"
          />
        </BaseChartsGrid>
      ) : null}

      {/* Grids */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <SectionCard
            title={
              <Box>
                <ScienceMUI sx={{ verticalAlign: 'middle', mr: 1 }} />
                Newest Tests
              </Box>
            }
          >
            <RowsTable<UiTestRow>
              rows={props.recentCreated.rows}
              columns={[
                { key: 'behaviorName', label: 'Behavior', width: 130 },
                { key: 'topicName', label: 'Topic', width: 130 },
                { key: 'prompt', label: 'Prompt' },
                { key: 'ownerDisplayName', label: 'Owner', width: 180 },
              ]}
              pagination={props.recentCreated.pagination}
              totalRows={props.recentCreated.totalRows}
              onChangePagination={props.recentCreated.onChangePagination}
              loading={props.recentCreated.loading}
              error={props.recentCreated.error}
              testId="newest-tests"
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard
            title={
              <Box>
                <ScienceMUI sx={{ verticalAlign: 'middle', mr: 1 }} />
                Updated Tests
              </Box>
            }
          >
            <RowsTable<UiTestRow>
              rows={props.recentUpdated.rows}
              columns={[
                { key: 'behaviorName', label: 'Behavior', width: 130 },
                { key: 'topicName', label: 'Topic', width: 130 },
                { key: 'updatedAt', label: 'Update Time', width: 160, render: (r) => (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '') },
                { key: 'ownerDisplayName', label: 'Assignee' },
              ]}
              pagination={props.recentUpdated.pagination}
              totalRows={props.recentUpdated.totalRows}
              onChangePagination={props.recentUpdated.onChangePagination}
              loading={props.recentUpdated.loading}
              error={props.recentUpdated.error}
              testId="updated-tests"
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard
            title={
              <Box>
                <HorizontalSplit sx={{ verticalAlign: 'middle', mr: 1 }} />
                Newest Test Sets
              </Box>
            }
          >
            <RowsTable<UiTestSetRow>
              rows={props.testSets.rows}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'description', label: 'Description', width: 240, render: (r) => r.description ?? 'No description' },
                { key: 'visibility', label: 'Visibility', width: 120 },
              ]}
              pagination={props.testSets.pagination}
              totalRows={props.testSets.totalRows}
              onChangePagination={props.testSets.onChangePagination}
              loading={props.testSets.loading}
              error={props.testSets.error}
              testId="newest-test-sets"
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard
            title={
              <Box>
                <PlayArrow sx={{ verticalAlign: 'middle', mr: 1 }} />
                Recent Test Runs
              </Box>
            }
          >
            <Typography variant="body2" color="text.secondary">
              No recent runs available.
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}