'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { GridPaginationModel } from '@mui/x-data-grid';

import TokensGrid from './TokensGrid';
import CreateTokenModal from './CreateTokenModal';
import TokenDisplay from './TokenDisplay';
import { DeleteModal } from '@/components/common/DeleteModal';
import { useNotifications } from '@/components/common/NotificationContext';

import type { CreateTokenTokensPostResponse } from '@/api-client/types.gen';
import {
  readTokensTokensGetOptions,
  createTokenTokensPostMutation,
  refreshTokenTokensTokenIdRefreshPostMutation,
  deleteTokenTokensTokenIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

interface TokensPageClientProps {

}

export default function TokensPageClient({}: TokensPageClientProps) {
  const { show } = useNotifications();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newToken, setNewToken] = useState<CreateTokenTokensPostResponse | null>(null);
  const [refreshedToken, setRefreshedToken] = useState<CreateTokenTokensPostResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const skip = useMemo(
      () => paginationModel.page * paginationModel.pageSize,
      [paginationModel.page, paginationModel.pageSize],
  );

  const listQuery = useQuery({
    ...readTokensTokensGetOptions({
      query: {
        skip,
        limit: paginationModel.pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    }),
    placeholderData: keepPreviousData,
  });

  const tokens = listQuery.data ?? [];
  const totalCount = listQuery.data?.pagination?.totalCount ?? 0;
  const loading = listQuery.isFetching;

  if (listQuery.error && !error) {
    setError((listQuery.error as Error).message || 'Failed to load tokens');
  }

  const createMutation = useMutation({
    ...createTokenTokensPostMutation(),
  });

  const refreshMutation = useMutation({
    ...refreshTokenTokensTokenIdRefreshPostMutation(),
  });

  const deleteMutation = useMutation({
    ...deleteTokenTokensTokenIdDeleteMutation(),
  });

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setNewToken(null);
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateToken = useCallback(
      async (name: string, expiresInDays: number | null) => {
        setError(null);
        try {
          const created = await createMutation.mutateAsync({
            body: { name, expires_in_days: expiresInDays },
          });
          // ensure name is present for the display, in case backend omits it
          const tokenForDisplay: CreateTokenTokensPostResponse = { ...(created as CreateTokenTokensPostResponse), name };
          setNewToken(tokenForDisplay);
          setIsCreateModalOpen(false);
          await listQuery.refetch();
          show('Token created', { severity: 'success' });
        } catch (e) {
          const msg = (e as Error).message ?? 'Failed to create token';
          setError(msg);
          show(msg, { severity: 'error' });
          throw e;
        }
      },
      [createMutation, listQuery, show],
  );

  const handleCloseNewToken = useCallback(() => {
    setNewToken(null);
  }, []);

  const handleRefreshToken = useCallback(
      async (tokenId: string, expiresInDays: number | null) => {
        setError(null);
        try {
          const refreshed = await refreshMutation.mutateAsync({
            path: { token_id: tokenId },
            body: { expires_in_days: expiresInDays },
          } as never);
          await listQuery.refetch();
          setRefreshedToken(refreshed as CreateTokenTokensPostResponse);
          show('Token refreshed', { severity: 'success' });
        } catch (e) {
          const msg = (e as Error).message ?? 'Failed to refresh token';
          setError(msg);
          show(msg, { severity: 'error' });
        }
      },
      [refreshMutation, listQuery, show],
  );

  const handleDeleteToken = useCallback((tokenId: string) => {
    setDeleteTokenId(tokenId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTokenId) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync({ path: { token_id: deleteTokenId } } as never);
      setDeleteTokenId(null);
      await listQuery.refetch();
      show('Token deleted', { severity: 'success' });
    } catch (e) {
      const msg = (e as Error).message ?? 'Failed to delete token';
      setError(msg);
      setDeleteTokenId(null);
      show(msg, { severity: 'error' });
    }
  }, [deleteTokenId, deleteMutation, listQuery, show]);

  const tokenList = ('data' in tokens) ? tokens.data: []
  return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
            Create API Token
          </Button>
        </Box>

        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
        )}
        <TokensGrid
            tokens={tokenList}
            onRefreshToken={handleRefreshToken}
            onDeleteToken={handleDeleteToken}
            loading={loading}
            totalCount={totalCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
        />

        {/* Create new token */}
        <CreateTokenModal
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateToken={handleCreateToken}
        />

        {/* Newly created token display */}
        <TokenDisplay open={newToken !== null} onClose={handleCloseNewToken} token={newToken} />

        {/* Refreshed token inline dialog (kept to match original UX) */}
        <Dialog open={refreshedToken !== null} onClose={() => setRefreshedToken(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Your Refreshed API Token</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Token Name: {refreshedToken?.name ?? tokenList.find(t => t.id === deleteTokenId)?.name ?? '—'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Expires:{' '}
              {refreshedToken?.expires_at
                  ? new Date(refreshedToken.expires_at).toLocaleDateString()
                  : 'Never'}
            </Typography>
            <Typography color="warning.main" sx={{ mb: 2 }}>
              Store this token securely — it won&apos;t be shown again. If you lose it, you&apos;ll need to
              generate a new one.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                  fullWidth
                  value={refreshedToken?.access_token ?? ''}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
              />
              <IconButton
                  onClick={async () => {
                    if (refreshedToken?.access_token) {
                      await navigator.clipboard.writeText(refreshedToken.access_token);
                      show('Token copied to clipboard!', { severity: 'success' });
                    }
                  }}
                  color="primary"
                  aria-label="copy token"
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRefreshedToken(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirm modal */}
        <DeleteModal
            open={deleteTokenId !== null}
            onClose={() => setDeleteTokenId(null)}
            onConfirm={confirmDelete}
            itemType="token"
            itemName={tokenList.find(t => t.id === deleteTokenId)?.name}
            message={
              deleteTokenId && tokenList.find(t => t.id === deleteTokenId)?.name
                  ? `Are you sure you want to delete the token "${tokenList.find(t => t.id === deleteTokenId)?.name}"? This action cannot be undone, and any applications using this token will no longer be able to authenticate.`
                  : `Are you sure you want to delete this token? This action cannot be undone, and any applications using this token will no longer be able to authenticate.`
            }
        />
      </Box>
  );
}
