'use client';

import * as React from 'react';
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import type { UiStepListProps, UiTestSetRow } from '../types';

function ChipContainer({ items }: { readonly items: readonly string[] }) {
  if (items.length === 0) return <>{'-'}</>;
  const visible = items.slice(0, 4);
  const rest = items.length - visible.length;
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', alignItems: 'center', overflow: 'hidden' }}>
      {visible.map((it) => (
        <Chip key={it} label={it} size="small" variant="outlined" />
      ))}
      {rest > 0 ? <Chip label={`+${rest}`} size="small" variant="outlined" /> : null}
    </Box>
  );
}

function Assignee({ row }: { readonly row: UiTestSetRow }) {
  if (!row.assigneeDisplay) return <>-</>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar src={row.assigneeAvatarUrl} sx={{ width: 24, height: 24 }} />
      <Typography variant="body2">{row.assigneeDisplay}</Typography>
    </Box>
  );
}

export default function StepList(props: UiStepListProps) {
  const {
    rows,
    totalRows,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    selectedIds,
    onSelectionChange,
    onRowClick,
    loading,
    onNew,
    onRun,
    onDelete,
  } = props;

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedIds.includes(r.id));

  const toggleAll = (checked: boolean) => {
    onSelectionChange(checked ? rows.map((r) => r.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    const set = new Set(selectedIds);
    if (checked) set.add(id);
    else set.delete(id);
    onSelectionChange(Array.from(set));
  };

  return (
    <Box>
      <TableContainer>
        <Table size="small" aria-label="test-sets-table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  data-test-id="select-all"
                  indeterminate={someSelected}
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Behaviors</TableCell>
              <TableCell>Categories</TableCell>
              <TableCell>Tests</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Tasks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onRowClick(row.id)}
                data-test-id={`row-${row.id}`}
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    data-test-id={`select-${row.id}`}
                    checked={selectedIds.includes(row.id)}
                    onChange={(e) => toggleOne(row.id, e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                <TableCell><ChipContainer items={row.behaviors} /></TableCell>
                <TableCell><ChipContainer items={row.categories} /></TableCell>
                <TableCell>{row.totalTests}</TableCell>
                <TableCell>
                  <Chip label={row.status} size="small" variant="outlined" />
                </TableCell>
                <TableCell><Assignee row={row} /></TableCell>
                <TableCell>{row.comments ? <Typography variant="body2">{row.comments}</Typography> : null}</TableCell>
                <TableCell>{row.tasks ? <Typography variant="body2">{row.tasks}</Typography> : null}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" color="text.secondary">
                    No test sets found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
        rowsPerPageOptions={[10, 25, 50]}
      />

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <button data-test-id="action-new" onClick={onNew} />
        <button data-test-id="action-run" onClick={onRun} />
        <button data-test-id="action-delete" onClick={onDelete} />
      </Box>
    </Box>
  );
}