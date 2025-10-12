'use client';

import * as React from 'react';
import {
  Box,
  Chip,
  Avatar,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import PersonIcon from '@mui/icons-material/Person';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/common/NotificationContext';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { DeleteIcon } from '@/components/icons';
import { DeleteModal } from '@/components/common/DeleteModal';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { User } from '@/api-client/types.gen';

import {
  readUsersUsersGetOptions,
  deleteUserUsersUserIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface TeamMembersGridProps {
  /** Used to trigger refresh when new invites are sent */
  refreshTrigger?: number;
}

export default function TeamMembersGrid({ refreshTrigger }: TeamMembersGridProps) {
  const { data: session } = useSession();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const skip = paginationModel.page * paginationModel.pageSize;
  const limit = paginationModel.pageSize;

  /** Users list query (server-side pagination) */
  const usersOpts = readUsersUsersGetOptions({
    query: { skip, limit },
  });

  const usersQuery = useQuery({
    ...usersOpts,
    select: (data) => data,
  });

  /** Delete user mutation */
  const deleteUserMutation = useMutation(deleteUserUsersUserIdDeleteMutation());

  /** Refresh when invites were sent elsewhere */
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      void usersQuery.refetch();
    }
  }, [refreshTrigger, usersQuery]);

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  };

  /** Delete modal state */
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const openDeleteFor = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  const closeDelete = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      if (!userToDelete.id) {
        notifications.show(
            `Failure in removed ${getDisplayName(userToDelete)} from the organization.`,
            { severity: 'error' }
        );
        return;
      }
      setDeleting(true);
      await deleteUserMutation.mutateAsync({
        path: { user_id: userToDelete.id },
      });

      notifications.show(
          `Successfully removed ${getDisplayName(userToDelete)} from the organization.`,
          { severity: 'success' }
      );

      // Refresh current page
      void queryClient.invalidateQueries({ queryKey: usersOpts.queryKey });
    } catch (err: unknown) {
      const msg =
          (err as Error)?.message ??
          'Failed to remove user from organization. Please try again.';
      notifications.show(msg, { severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  /** Helpers */
  const getUserStatus = (user: User) => {
    const hasProfile =
        !!user.name || !!user.given_name || !!user.family_name || !!(user).auth0_id;
    return hasProfile ? 'active' : 'invited';
  };

  const getDisplayName = (user: User) => {
    if (user.name) return user.name;
    const composed = `${user.given_name ?? ''} ${user.family_name ?? ''}`.trim();
    return composed || user.email;
  };

  const rows = usersQuery.data?.data ?? [];
  const totalCount = usersQuery.data?.pagination.totalCount ?? 0;
  const loading = usersQuery.isPending;
  const loadError = usersQuery.isError
      ? (usersQuery.error as Error)?.message ?? 'Failed to load team members.'
      : null;

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => {
        const user = params.row as User;
        const status = getUserStatus(user);

        return (
            <Avatar
                src={(user).picture || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: status === 'active' ? 'primary.main' : 'grey.400',
                }}
            >
              {(user).picture ? null : <PersonIcon fontSize="small" />}
            </Avatar>
        );
      },
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const user = params.row as User;
        return (
            <Typography variant="body2" fontWeight="medium">
              {getDisplayName(user)}
            </Typography>
        );
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => {
        const user = params.row as User;
        return <Typography variant="body2">{user.email}</Typography>;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const user = params.row as User;
        const status = getUserStatus(user);
        return (
            <Chip
                label={status === 'active' ? 'Active' : 'Invited'}
                size="small"
                color={status === 'active' ? 'success' : 'warning'}
                variant="outlined"
            />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const user = params.row as User;
        const currentUserId = session?.user?.id;

        // Don't show actions for current user
        if (user.id === currentUserId) return null;

        return (
            <IconButton
                onClick={() => openDeleteFor(user)}
                size="small"
                title="Remove from organization"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
        );
      },
    },
  ];

  if (loadError) {
    return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
    );
  }

  return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Team Members ({totalCount})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your organization&apos;s team members and their access
          </Typography>
        </Box>

        <BaseDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => (row as User).id ??''}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            serverSidePagination
            totalRows={totalCount}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            enableQuickFilter
            disablePaperWrapper
            sx={{
              '& .MuiDataGrid-row': {
                '&:hover': { backgroundColor: 'action.hover' },
              },
            }}
        />

        <DeleteModal
            open={deleteDialogOpen}
            onClose={closeDelete}
            onConfirm={handleConfirmDelete}
            isLoading={deleting}
            title="Remove from Organization"
            message={`Are you sure you want to remove ${
                userToDelete ? getDisplayName(userToDelete) : ''
            } from the organization?\n\nThey will lose access to all organization resources but can be re-invited in the future. Their contributions to projects and tests will remain intact.`}
            itemType="user"
            confirmButtonText={deleting ? 'Removing...' : 'Remove from Organization'}
        />
      </Box>
  );
}
