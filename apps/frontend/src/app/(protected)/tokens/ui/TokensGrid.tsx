'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Chip,
  Box,
  IconButton,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import { formatDistanceToNow } from 'date-fns';
import BaseDataGrid from '@/components/common/BaseDataGrid';
import { DeleteIcon, VpnKeyIcon } from '@/components/icons';

import RefreshTokenModal from './RefreshTokenModal';
import type { UiPaginationModel, UiTokenRow } from './types';

type Props = {
  readonly tokens: readonly UiTokenRow[];
  readonly loading: boolean;
  readonly totalCount: number;
  readonly paginationModel: UiPaginationModel;
  readonly onPaginationModelChange: (model: UiPaginationModel) => void;
  readonly onRefreshToken: (tokenId: string, expiresInDays: number | null) => Promise<void>;
  readonly onDeleteToken: (tokenId: string) => void;
};

export default function TokensGrid({
  tokens,
  loading,
  totalCount,
  paginationModel,
  onPaginationModelChange,
  onRefreshToken,
  onDeleteToken,
}: Props) {
  const [refreshModalOpen, setRefreshModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const handleRefreshClick = useCallback((tokenId: string) => {
    setSelectedTokenId(tokenId);
    setRefreshModalOpen(true);
  }, []);

  const isFuture = useCallback((iso?: string | null) => {
    if (!iso) return false;
    return new Date(iso).getTime() > Date.now();
  }, []);

  const columns: GridColDef<UiTokenRow>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        renderCell: (params: GridRenderCellParams<UiTokenRow>) => (
          <Box sx={{ fontWeight: 500 }}>{params.row.name}</Box>
        ),
      },
      {
        field: 'token_obfuscated',
        headerName: 'Token',
        flex: 1.5,
        renderCell: (params: GridRenderCellParams<UiTokenRow>) => params.row.token_obfuscated,
      },
      {
        field: 'last_used_at',
        headerName: 'Last Used',
        flex: 1,
        renderCell: (params: GridRenderCellParams<UiTokenRow>) =>
          params.row.last_used_at
            ? formatDistanceToNow(new Date(params.row.last_used_at), { addSuffix: true })
            : 'Never',
      },
      {
        field: 'expires_at',
        headerName: 'Expires',
        flex: 1,
        renderCell: (params: GridRenderCellParams<UiTokenRow>) => {
          const exp = params.row.expires_at;
          if (!exp) {
            return (
              <Chip
                label="Never"
                size="small"
                variant="outlined"
                sx={{ borderColor: 'success.light', color: 'success.main', bgcolor: 'transparent' }}
              />
            );
          }
          const future = isFuture(exp);
          return (
            <Chip
              label={formatDistanceToNow(new Date(exp), { addSuffix: true })}
              size="small"
              variant="outlined"
              sx={{
                borderColor: future ? 'success.light' : 'error.light',
                color: future ? 'success.main' : 'error.main',
                bgcolor: 'transparent',
              }}
            />
          );
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.5,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<UiTokenRow>) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Invalidate and refresh">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefreshClick(params.row.id);
                }}
                aria-label="invalidate and refresh token"
                data-test-id="refresh-token"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Token">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteToken(params.row.id);
                }}
                aria-label="delete token"
                data-test-id="delete-token"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleRefreshClick, isFuture, onDeleteToken],
  );

  if (!loading && tokens.length === 0) {
    return (
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          mb: 2,
          textAlign: 'center',
          py: 8,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VpnKeyIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }} />
        </Box>

        <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 500 }}>
          No API tokens yet
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 550, mx: 'auto' }}>
          Create your first API token to start interacting with the Rhesis API. Tokens allow you to
          authenticate your applications and build powerful integrations.
        </Typography>
      </Paper>
    );
  }

  const gridPaginationModel: GridPaginationModel = {
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
  };

  const handleGridPaginationChange = (model: GridPaginationModel) => {
    onPaginationModelChange({ page: model.page, pageSize: model.pageSize });
  };

  const selectedName = (selectedTokenId && tokens.find((t) => t.id === selectedTokenId)?.name) || '';

  return (
    <>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          <BaseDataGrid
            columns={columns}
            rows={tokens}
            loading={loading}
            getRowId={(row: UiTokenRow) => row.id}
            density="standard"
            paginationModel={gridPaginationModel}
            onPaginationModelChange={handleGridPaginationChange}
            serverSidePagination
            totalRows={totalCount}
            pageSizeOptions={[10, 25, 50]}
            disablePaperWrapper
          />
        </Box>
      </Paper>

      <RefreshTokenModal
        open={refreshModalOpen}
        onClose={() => setRefreshModalOpen(false)}
        onRefresh={async (expiresInDays) => {
          if (selectedTokenId) {
            await onRefreshToken(selectedTokenId, expiresInDays);
            setRefreshModalOpen(false);
          }
        }}
        tokenName={selectedName}
      />
    </>
  );
}