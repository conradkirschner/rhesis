'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
  GridFilterModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { Typography, Box, Alert, Avatar, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import BaseDataGrid from '@/components/common/BaseDataGrid';
import TestDrawer from './TestDrawer';
import TestSetSelectionDialog from './TestSetSelectionDialog';
import { useNotifications } from '@/components/common/NotificationContext';
import { DeleteModal } from '@/components/common/DeleteModal';
import { ChatIcon, DescriptionIcon } from '@/components/icons';
import { convertGridFilterModelToOData } from '@/utils/odata-filter';

import type { TestDetail } from '@/api-client/types.gen';
import {
  readTestsTestsGetOptions,
  deleteTestTestsTestIdDeleteMutation,
  associateTestsWithTestSetTestSetsTestSetIdAssociatePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface TestsTableProps {
  onRefresh?: () => void;
}

type TestSetOption = { id: string; name: string };

export default function TestsTable({ onRefresh }: TestsTableProps) {
  const router = useRouter();
  const notifications = useNotifications();
  const isMounted = useRef(true);

  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestDetail | undefined>();
  const [testSetDialogOpen, setTestSetDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const odataFilter = useMemo(() => convertGridFilterModelToOData(filterModel), [filterModel]);

  const testsQuery = useQuery({
    ...readTestsTestsGetOptions({
      query: {
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...(odataFilter ? { $filter: odataFilter } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  });

  const rows: TestDetail[] = testsQuery.data?.data ?? [];
  const totalCount = testsQuery.data?.pagination?.totalCount ?? 0;
  const loading = testsQuery.isFetching;
  const errorMsg = (testsQuery.error as Error | undefined)?.message ?? null;

  const deleteMutation = useMutation({
    ...deleteTestTestsTestIdDeleteMutation(),
  });

  const associateMutation = useMutation({
    ...associateTestsWithTestSetTestSetsTestSetIdAssociatePostMutation(),
  });

  const columns: GridColDef<TestDetail>[] = [
    {
      field: 'prompt.content',
      headerName: 'Content',
      flex: 3,
      filterable: true,
      valueGetter: (_value, row) => row.prompt?.content ?? '',
      renderCell: (params) => {
        const content = params.row.prompt?.content ?? '';
        if (!content) return null;
        return (
            <Typography
                variant="body2"
                title={content}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {content}
            </Typography>
        );
      },
    },
    {
      field: 'behavior.name',
      headerName: 'Behavior',
      flex: 1,
      filterable: true,
      valueGetter: (_value, row) => row.behavior?.name ?? '',
      renderCell: (params) => {
        const behaviorName = params.row.behavior?.name;
        return behaviorName ? <Chip label={behaviorName} size="small" variant="outlined" /> : null;
      },
    },
    {
      field: 'topic.name',
      headerName: 'Topic',
      flex: 1,
      filterable: true,
      valueGetter: (_value, row) => row.topic?.name ?? '',
      renderCell: (params) => {
        const topicName = params.row.topic?.name;
        return topicName ? <Chip label={topicName} size="small" variant="outlined" /> : null;
      },
    },
    {
      field: 'category.name',
      headerName: 'Category',
      flex: 1,
      filterable: true,
      valueGetter: (_value, row) => row.category?.name ?? '',
      renderCell: (params) => {
        const categoryName = params.row.category?.name;
        return categoryName ? <Chip label={categoryName} size="small" variant="outlined" /> : null;
      },
    },
    {
      field: 'assignee.name',
      headerName: 'Assignee',
      flex: 1,
      filterable: true,
      valueGetter: (_value, row) => {
        const a = row.assignee;
        if (!a) return '';
        return a.name || `${a.given_name ?? ''} ${a.family_name ?? ''}`.trim() || a.email || '';
      },
      renderCell: (params) => {
        const a = params.row.assignee;
        if (!a) return null;
        const displayName = a.name || `${a.given_name ?? ''} ${a.family_name ?? ''}`.trim() || a.email;
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

  const handleRowClick = useCallback(
      (params: GridRowParams<TestDetail>) => {
        router.push(`/tests/${String(params.id)}`);
      },
      [router],
  );

  const handleSelectionChange = useCallback((newSelection: GridRowSelectionModel) => {
    setSelectedRows(newSelection);
  }, []);

  const handleCreateTestSet = useCallback(() => {
    if (selectedRows.length > 0) setTestSetDialogOpen(true);
  }, [selectedRows.length]);

  const handleTestSetSelect = useCallback(
      async (testSet: TestSetOption) => {
        try {
          await associateMutation.mutateAsync({
            path: { test_set_id: testSet.id },
            body: { test_ids: selectedRows.map(String) },
          });
          if (!isMounted.current) return;

          notifications.show(
              `Successfully associated ${selectedRows.length} ${selectedRows.length === 1 ? 'test' : 'tests'} with test set "${testSet.name}"`,
              { severity: 'success', autoHideDuration: 6000 },
          );
          setTestSetDialogOpen(false);
          setSelectedRows([]);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Associate tests -> test set failed:', err);
          notifications.show('Failed to associate tests with test set', {
            severity: 'error',
            autoHideDuration: 6000,
          });
        }
      },
      [associateMutation, notifications, selectedRows],
  );

  const handleDeleteTests = useCallback(() => {
    if (selectedRows.length > 0) setDeleteModalOpen(true);
  }, [selectedRows.length]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedRows.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(
          selectedRows.map((id) => deleteMutation.mutateAsync({ path: { test_id: String(id) } })),
      );

      notifications.show(
          `Successfully deleted ${selectedRows.length} ${selectedRows.length === 1 ? 'test' : 'tests'}`,
          { severity: 'success', autoHideDuration: 4000 },
      );

      setSelectedRows([]);
      await testsQuery.refetch();
      onRefresh?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error deleting tests:', err);
      notifications.show('Failed to delete tests', {
        severity: 'error',
        autoHideDuration: 6000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  }, [selectedRows, deleteMutation, notifications, testsQuery, onRefresh]);

  const handleDeleteCancel = useCallback(() => setDeleteModalOpen(false), []);

  const handleNewTest = useCallback(() => {
    setSelectedTest(undefined);
    setDrawerOpen(true);
  }, []);

  const generateNewTests = useCallback(() => {
    router.push('/tests/new-generated');
  }, [router]);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedTest(undefined);
  }, []);

  const handleTestSaved = useCallback(async () => {
    if (paginationModel.page !== 0) {
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    } else {
      await testsQuery.refetch();
    }
    onRefresh?.();
  }, [paginationModel.page, testsQuery, onRefresh]);

  const handlePaginationModelChange = useCallback((newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  }, []);

  const handleFilterModelChange = useCallback((newModel: GridFilterModel) => {
    setFilterModel(newModel);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const getActionButtons = useCallback(() => {
    const buttons: {
      label: string;
      icon: React.ReactNode;
      variant: 'text' | 'outlined' | 'contained';
      color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
      onClick: () => void;
      splitButton?: { options: Array<{ label: string; onClick: () => void }> };
    }[] = [];

    buttons.push({
      label: 'Write Test',
      icon: <AddIcon />,
      variant: 'contained',
      onClick: handleNewTest,
      splitButton: {
        options: [
          {
            label: 'Write Multiple Tests',
            onClick: () => router.push('/tests/new?multiple=true'),
          },
        ],
      },
    });

    buttons.push({
      label: 'Generate Tests',
      icon: <AddIcon />,
      variant: 'contained',
      onClick: () => generateNewTests(),
    });

    if (selectedRows.length > 0) {
      buttons.push({
        label: 'Assign to Test Set',
        icon: <ListIcon />,
        variant: 'contained',
        onClick: handleCreateTestSet,
      });

      buttons.push({
        label: 'Delete Tests',
        icon: <DeleteIcon />,
        variant: 'outlined',
        color: 'error',
        onClick: handleDeleteTests,
      });
    }

    return buttons;
  }, [selectedRows.length, handleNewTest, router, generateNewTests, handleCreateTestSet, handleDeleteTests]);

  return (
      <>
        {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
        )}

        {selectedRows.length > 0 && (
            <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
            >
              <Typography variant="subtitle1" color="primary">
                {selectedRows.length} tests selected
              </Typography>
            </Box>
        )}

        <BaseDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            actionButtons={getActionButtons()}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={selectedRows}
            onRowClick={handleRowClick}
            serverSidePagination
            totalRows={totalCount}
            pageSizeOptions={[10, 25, 50]}
            serverSideFiltering
            onFilterModelChange={handleFilterModelChange}
            showToolbar
            disablePaperWrapper
        />

        {/* Drawers / Dialogs */}
        <>
          <TestDrawer
              open={drawerOpen}
              onClose={handleDrawerClose}
              test={selectedTest}
              onSuccess={handleTestSaved}
          />

          <TestSetSelectionDialog
              open={testSetDialogOpen}
              onClose={() => setTestSetDialogOpen(false)}
              onSelect={handleTestSetSelect}
          />

          <DeleteModal
              open={deleteModalOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              isLoading={isDeleting}
              title="Delete Tests"
              message={`Are you sure you want to delete ${selectedRows.length} ${selectedRows.length === 1 ? 'test' : 'tests'}? Don't worry, related data will not be deleted, only ${selectedRows.length === 1 ? 'this record' : 'these records'}.`}
              itemType="tests"
          />
        </>
      </>
  );
}
