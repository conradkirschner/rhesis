'use client';

import * as React from 'react';
import { Box, Typography, Avatar, Chip, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { GridColDef } from '@mui/x-data-grid';
import { Delete as MuiDeleteIcon } from '@mui/icons-material';
import type { UiTeamMember, UiTeamMembersGridProps } from './types';

export default function TeamMembersGrid(props: UiTeamMembersGridProps) {
  const {
    rows,
    totalCount,
    paginationModel,
    onPaginationModelChange,
    loading,
    currentUserId,
    onRequestRemove,
  } = props;

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'avatar',
        headerName: '',
        width: 60,
        sortable: false,
        renderCell: (params) => {
          const user = params.row as UiTeamMember;
          return (
            <Avatar
              src={user.picture}
              sx={{
                width: 32,
                height: 32,
                bgcolor: user.status === 'active' ? 'primary.main' : 'grey.400',
              }}
            >
              {user.picture ? null : <PersonIcon fontSize="small" />}
            </Avatar>
          );
        },
      },
      {
        field: 'displayName',
        headerName: 'Name',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 250,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => {
          const user = params.row as UiTeamMember;
          return (
            <Chip
              label={user.status === 'active' ? 'Active' : 'Invited'}
              size="small"
              color={user.status === 'active' ? 'success' : 'warning'}
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
          const user = params.row as UiTeamMember;
          if (user.id === currentUserId) return null;
          return (
            <IconButton
              size="small"
              title="Remove from organization"
              onClick={() => onRequestRemove(user.id)}
              data-test-id={`remove-user-${user.id}`}
              aria-label="remove-from-organization"
            >
              <MuiDeleteIcon fontSize="small" />
            </IconButton>
          );
        },
      },
    ],
    [currentUserId, onRequestRemove],
  );

  return (
    <Box component="section" data-test-id="team-members-section">
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
        getRowId={(row) => (row as UiTeamMember).id}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
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
    </Box>
  );
}