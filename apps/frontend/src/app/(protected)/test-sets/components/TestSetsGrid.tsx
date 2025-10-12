'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
} from '@mui/x-data-grid';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { useRouter } from 'next/navigation';
import { Box, Chip, Tooltip, Typography, Avatar } from '@mui/material';
import { ChatIcon, DescriptionIcon } from '@/components/icons';
import { useSession } from 'next-auth/react';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import TestSetDrawer from './TestSetDrawer';
import TestRunDrawer from './TestRunDrawer';
import { DeleteModal } from '@/components/common/DeleteModal';
import { useNotifications } from '@/components/common/NotificationContext';
import {keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import type { TestSet } from '@/api-client/types.gen';
import {
  readTestSetsTestSetsGetOptions,
  deleteTestSetTestSetsTestSetIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface StatusInfo {
  label: string;
  borderColor: string;
  color: string;
}

type WithStatus = { status?: string | { name: string } };
function getStatusInfo<T extends TestSet>(testSet: T & Partial<WithStatus>): StatusInfo {
  const s = testSet.status;
  const label =
      typeof s === 'string' ? s : s && typeof s === 'object' && 'name' in s ? s.name : 'Unknown';
  return { label, borderColor: 'primary.light', color: 'primary.main' };
}

interface TestSetsGridProps {
  testSets: TestSet[];
  loading: boolean;
  sessionToken?: string;
  initialTotalCount?: number;
}

/* --------------------------- helper chip container -------------------------- */

const ChipContainer = ({ items }: { items: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);

  React.useEffect(() => {
    const calculateVisibleChips = () => {
      if (!containerRef.current || items.length === 0) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const tempDiv = document.createElement('div');
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.position = 'absolute';
      document.body.appendChild(tempDiv);

      let totalWidth = 0;
      let visibleCount = 0;

      const overflowChip = document.createElement('div');
      overflowChip.innerHTML =
          '<span class="MuiChip-root" style="padding: 0 8px;">+99</span>';
      document.body.appendChild(overflowChip);
      const overflowChipWidth =
          (overflowChip.firstChild as HTMLElement)?.getBoundingClientRect().width || 0;
      overflowChip.remove();

      for (let i = 0; i < items.length; i++) {
        const chip = document.createElement('div');
        chip.innerHTML = `<span class="MuiChip-root" style="padding: 0 8px;">${items[i]}</span>`;
        tempDiv.appendChild(chip);
        const chipWidth =
            (chip.firstChild as HTMLElement)?.getBoundingClientRect().width || 0;

        if (
            totalWidth +
            chipWidth +
            (i < items.length - 1 ? overflowChipWidth : 0) <=
            containerWidth - 16
        ) {
          totalWidth += chipWidth + 8;
          visibleCount++;
        } else {
          break;
        }
      }

      tempDiv.remove();
      setVisibleItems(items.slice(0, visibleCount));
      setRemainingCount(items.length - visibleCount);
    };

    calculateVisibleChips();
    window.addEventListener('resize', calculateVisibleChips);
    return () => window.removeEventListener('resize', calculateVisibleChips);
  }, [items]);

  if (items.length === 0) return <>{'-'}</>;

  return (
      <Box
          ref={containerRef}
          sx={{ display: 'flex', gap: 0.5, alignItems: 'center', width: '100%', overflow: 'hidden' }}
      >
        {visibleItems.map((item) => (
            <Chip key={item} label={item} size="small" variant="outlined" />
        ))}
        {remainingCount > 0 && (
            <Tooltip title={items.slice(visibleItems.length).join(', ')} arrow>
              <Chip label={`+${remainingCount}`} size="small" variant="outlined" />
            </Tooltip>
        )}
      </Box>
  );
};

/* --------------------------------- guards ---------------------------------- */

type AssigneeLite = {
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

type WithAssignee = { assignee?: AssigneeLite | null };
function hasAssignee(x: unknown): x is WithAssignee {
  return typeof x === 'object' && x !== null && 'assignee' in x;
}

type CountsLite = { comments?: number; tasks?: number };
type WithCounts = { counts?: CountsLite };
function hasCounts(x: unknown): x is WithCounts {
  return typeof x === 'object' && x !== null && 'counts' in x;
}

/* -------------------------------- component -------------------------------- */

export default function TestSetsGrid({
                                       testSets: initialTestSets,
                                       loading: initialLoading,
                                       sessionToken,
                                       initialTotalCount,
                                     }: TestSetsGridProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const notifications = useNotifications();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [testRunDrawerOpen, setTestRunDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // list query
  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  const listQuery = useQuery({
    ...readTestSetsTestSetsGetOptions(
        {
          query: {
            skip,
            limit,
            sort_by: 'created_at',
            sort_order: 'desc',
          },
        },
    ),
    placeholderData: keepPreviousData,
  });

  // normalize
  const { rows, totalCount, loading } = useMemo(() => {
    const fetching = listQuery.isFetching && !listQuery.data && initialLoading;
    const raw = listQuery.data as
        | TestSet[]
        | { data?: TestSet[]; pagination?: { totalCount?: number } }
        | undefined;

    if (!raw) {
      return {
        rows: initialTestSets ?? [],
        totalCount: initialTotalCount ?? (initialTestSets?.length ?? 0),
        loading: fetching,
      };
    }

    if (Array.isArray(raw)) {
      return { rows: raw, totalCount: raw.length, loading: listQuery.isFetching };
    }

    const data = Array.isArray(raw.data) ? raw.data : [];
    const total =
        typeof raw.pagination?.totalCount === 'number'
            ? raw.pagination.totalCount
            : data.length;

    return { rows: data, totalCount: total, loading: listQuery.isFetching };
  }, [listQuery.data, listQuery.isFetching, initialLoading, initialTestSets, initialTotalCount]);

  // delete mutation
  const deleteMutation = useMutation({
    ...deleteTestSetTestSetsTestSetIdDeleteMutation(),
    onSuccess: () => {
      notifications.show(
          `Successfully deleted ${selectedRows.length} ${
              selectedRows.length === 1 ? 'test set' : 'test sets'
          }`,
          { severity: 'success', autoHideDuration: 4000 },
      );
      setSelectedRows([]);
      listQuery.refetch();
    },
    onError: (err) => {
      console.error('Error deleting test sets:', err);
      notifications.show('Failed to delete test sets', {
        severity: 'error',
        autoHideDuration: 6000,
      });
    },
  });

  // row shape
  type Row = {
    id: string;
    name: string;
    behaviors: string[];
    categories: string[];
    totalTests: number;
    status: string;
    assignee?: AssigneeLite | null;
    counts?: CountsLite;
  };

  const processedTestSets: Row[] = useMemo(
      () =>
          rows.map((testSet) => {
            const statusInfo = getStatusInfo(testSet);

            const assignee = hasAssignee(testSet) ? testSet.assignee ?? null : null;
            const counts = hasCounts(testSet) ? testSet.counts : undefined;

            return {
              id: String(testSet.id),
              name: testSet.name ?? '',
              behaviors: (testSet.attributes?.metadata?.behaviors ?? []) as string[],
              categories: (testSet.attributes?.metadata?.categories ?? []) as string[],
              totalTests: Number(testSet.attributes?.metadata?.total_tests ?? 0),
              status: statusInfo.label,
              assignee,
              counts,
            };
          }),
      [rows],
  );

  const columns: GridColDef<Row>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.5,
      renderCell: (params) => <span style={{ fontWeight: 500 }}>{params.value}</span>,
    },
    {
      field: 'behaviors',
      headerName: 'Behaviors',
      flex: 1.0,
      renderCell: (params) => <ChipContainer items={params.row.behaviors || []} />,
    },
    {
      field: 'categories',
      headerName: 'Categories',
      flex: 1.0,
      renderCell: (params) => <ChipContainer items={params.row.categories || []} />,
    },
    {
      field: 'totalTests',
      headerName: 'Tests',
      flex: 0.5,
      valueGetter: (_value, row) => row.totalTests,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
      renderCell: (params) => <Chip label={params.row.status} size="small" variant="outlined" />,
    },
    {
      field: 'assignee',
      headerName: 'Assignee',
      flex: 0.75,
      renderCell: (params) => {
        const a = params.row.assignee;
        if (!a) return '-';

        const displayName =
            a.name || `${a.given_name ?? ''} ${a.family_name ?? ''}`.trim() || a.email || '';

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={a.picture ?? undefined} sx={{ width: 24, height: 24 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="body2">{displayName}</Typography>
            </Box>
        );
      },
    },
    {
      field: 'counts.comments',
      headerName: 'Comments',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const count = params.row.counts?.comments ?? 0;
        if (count === 0) return null;
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{count}</Typography>
            </Box>
        );
      },
    },
    {
      field: 'counts.tasks',
      headerName: 'Tasks',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const count = params.row.counts?.tasks ?? 0;
        if (count === 0) return null;
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{count}</Typography>
            </Box>
        );
      },
    },
  ];

  const handleRowClick = (params: { id: string }) => {
    router.push(`/test-sets/${params.id}`);
  };

  const handlePaginationModelChange = useCallback(
      (newModel: GridPaginationModel) => setPaginationModel(newModel),
      [],
  );

  const handleNewTestSet = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleTestSetSaved = async () => {
    await listQuery.refetch();
  };

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    setSelectedRows(newSelection);
  };

  const handleRunTestSets = () => setTestRunDrawerOpen(true);
  const handleTestRunSuccess = () => setTestRunDrawerOpen(false);

  const handleDeleteTestSets = () => setDeleteModalOpen(true);

  const handleDeleteConfirm = async () => {
    if (!selectedRows.length) return;

    try {
      setIsDeleting(true);
      await Promise.all(
          selectedRows.map((id) =>
              deleteMutation.mutateAsync({ path: { test_set_id: String(id) } }),
          ),
      );
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getActionButtons = () => {
    const buttons: {
      label: string;
      icon: React.ReactNode;
      variant: 'text' | 'outlined' | 'contained';
      color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
      onClick: () => void;
      disabled?: boolean;
    }[] = [
      { label: 'New Test Set', icon: <AddIcon />, variant: 'contained', onClick: handleNewTestSet },
    ];

    if (selectedRows.length > 0) {
      buttons.push({
        label: selectedRows.length > 1 ? 'Run Test Sets' : 'Run Test Set',
        icon: <PlayArrowIcon />,
        variant: 'contained',
        onClick: handleRunTestSets,
      });
      buttons.push({
        label: 'Delete Test Sets',
        icon: <DeleteIcon />,
        variant: 'contained',
        color: 'error',
        onClick: handleDeleteTestSets,
        disabled: deleteMutation.isPending,
      });
    }

    return buttons;
  };

  return (
      <>
        {selectedRows.length > 0 && (
            <Box
                sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="subtitle1" color="primary">
                {selectedRows.length} test sets selected
              </Typography>
            </Box>
        )}

        <BaseDataGrid
            columns={columns}
            rows={processedTestSets}
            loading={loading || deleteMutation.isPending}
            getRowId={(row) => row.id}
            showToolbar={false}
            onRowClick={handleRowClick}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            actionButtons={getActionButtons()}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={selectedRows}
            serverSidePagination
            totalRows={totalCount}
            pageSizeOptions={[10, 25, 50]}
            disablePaperWrapper
        />


              <TestSetDrawer
                  open={drawerOpen}
                  onClose={handleDrawerClose}
                  onSuccess={handleTestSetSaved}
              />
              <TestRunDrawer
                  open={testRunDrawerOpen}
                  onClose={() => setTestRunDrawerOpen(false)}
                  selectedTestSetIds={selectedRows.map(String)}
                  onSuccess={handleTestRunSuccess}
              />
              <DeleteModal
                  open={deleteModalOpen}
                  onClose={() => setDeleteModalOpen(false)}
                  onConfirm={handleDeleteConfirm}
                  isLoading={isDeleting}
                  title="Delete Test Sets"
                  message={`Are you sure you want to delete ${selectedRows.length} ${
                      selectedRows.length === 1 ? 'test set' : 'test sets'
                  }? Don't worry, related data will not be deleted, only ${
                      selectedRows.length === 1 ? 'this record' : 'these records'
                  }.`}
                  itemType="test sets"
              />
      </>
  );
}
