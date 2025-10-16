'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import type { UiTaskListItem, UiTaskStats } from '../types';

type StatCardProps = { readonly title: string; readonly value: number };

const StatCard = ({ title, value }: StatCardProps) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom variant="subtitle2">
        {title}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

type OverviewProps = {
  readonly stats: UiTaskStats;
  readonly isLoading?: boolean;
};

export default function StepOverview({ stats, isLoading = false }: OverviewProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Loading stats…
          </Typography>
        </Box>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Total" value={stats.total} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Open" value={stats.open} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="In Progress" value={stats.inProgress} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Completed" value={stats.completed} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="Cancelled" value={stats.cancelled} />
        </Grid>
      </Grid>
    </Box>
  );
}

/** Lightweight table dedicated to this feature. */
export function TaskTable(props: {
  readonly rows: readonly UiTaskListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
  readonly onRowClick: (id: string) => void;
  readonly selectedIds: readonly string[];
  readonly onSelectionChange: (ids: readonly string[]) => void;
}) {
  const {
    rows,
    totalCount,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onRowClick,
    selectedIds,
    onSelectionChange,
  } = props;

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const toggleAll = (checked: boolean) => {
    onSelectionChange(checked ? rows.map((r) => r.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    onSelectionChange(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id));
  };

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Table size="small" aria-label="tasks-table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && selectedIds.length > 0}
                  onChange={(e) => toggleAll(e.target.checked)}
                  inputProps={{ 'data-test-id': 'select-all' }}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assignee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const checked = selectedIds.includes(row.id);
              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onRowClick(row.id)}
                  data-test-id={`row-${row.id}`}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => toggleOne(row.id, e.target.checked)}
                      inputProps={{ 'data-test-id': `select-${row.id}` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {row.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480 }}
                    >
                      {row.description ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.statusName ?? 'Unknown'}
                      color={
                        row.statusName === 'Open'
                          ? 'warning'
                          : row.statusName === 'In Progress'
                          ? 'primary'
                          : row.statusName === 'Completed'
                          ? 'success'
                          : row.statusName === 'Cancelled'
                          ? 'error'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={row.assigneeAvatar ?? undefined}
                        alt={row.assigneeName ?? 'Unassigned'}
                      >
                        {(row.assigneeName ?? 'U').charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{row.assigneeName ?? 'Unassigned'}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, p) => onPageChange(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </CardContent>
    </Card>
  );
}

StepOverview.TaskTable = TaskTable;