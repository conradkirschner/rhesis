'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTokensData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';

import FeaturePageFrame from '../ui/FeaturePageFrame';
import ActionBar from '../ui/ActionBar';
import TokensGrid from '../ui/TokensGrid';
import CreateTokenModal from '../ui/CreateTokenModal';
import TokenDisplay from '../ui/TokenDisplay';
import DeleteConfirmDialog from '../ui/DeleteConfirmDialog';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';

import type { UiPaginationModel, UiTokenRow } from '../ui/types';

const DEFAULT_PAGINATION: UiPaginationModel = { page: 0, pageSize: 10 };

export default function TokensContainer() {
  const { show } = useNotifications();

  const [pagination, setPagination] = useState<UiPaginationModel>(DEFAULT_PAGINATION);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState<{
    access_token: string;
    name?: string | null;
    expires_at?: string | null;
  } | null>(null);
  const [refreshedToken, setRefreshedToken] = useState<{
    access_token: string;
    name?: string | null;
    expires_at?: string | null;
  } | null>(null);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skip = useMemo(() => pagination.page * pagination.pageSize, [pagination.page, pagination.pageSize]);

  const { tokens, totalCount, isLoading, error: listError, createToken, refreshToken, deleteToken } =
    useTokensData({
      skip,
      limit: pagination.pageSize,
      sort_by: 'created_at',
      sort_order: 'desc',
    });

  if (!error && listError) {
    setError(listError);
  }

  const uiTokens = useMemo(
    () =>
      tokens.map(
        (t) =>
          ({
            id: t.id,
            name: t.name,
            token_obfuscated: t.token_obfuscated,
            last_used_at: t.last_used_at ?? null,
            expires_at: t.expires_at ?? null,
          }) satisfies UiTokenRow,
      ),
    [tokens],
  );

  const onCreate = useCallback(async (name: string, expiresInDays: number | null) => {
    setError(null);
    try {
      const created = (await createToken(name, expiresInDays)) as {
        access_token: string;
        name?: string | null;
        expires_at?: string | null;
      };
      setNewToken({ ...created, name });
      show('Token created', { severity: 'success' });
    } catch (e) {
      const msg = (e as Error).message ?? 'Failed to create token';
      setError(msg);
      show(msg, { severity: 'error' });
      throw e;
    }
  }, [createToken, show]);

  const onRefresh = useCallback(async (tokenId: string, expiresInDays: number | null) => {
    setError(null);
    try {
      const refreshed = (await refreshToken(tokenId, expiresInDays)) as {
        access_token: string;
        name?: string | null;
        expires_at?: string | null;
      };
      setRefreshedToken(refreshed);
      show('Token refreshed', { severity: 'success' });
    } catch (e) {
      const msg = (e as Error).message ?? 'Failed to refresh token';
      setError(msg);
      show(msg, { severity: 'error' });
    }
  }, [refreshToken, show]);

  const onRequestDelete = useCallback((tokenId: string) => {
    setDeleteTokenId(tokenId);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!deleteTokenId) return;
    setError(null);
    try {
      await deleteToken(deleteTokenId);
      setDeleteTokenId(null);
      show('Token deleted', { severity: 'success' });
    } catch (e) {
      const msg = (e as Error).message ?? 'Failed to delete token';
      setError(msg);
      setDeleteTokenId(null);
      show(msg, { severity: 'error' });
    }
  }, [deleteToken, deleteTokenId, show]);

  const selectedName =
    (deleteTokenId && uiTokens.find((t) => t.id === deleteTokenId)?.name) || undefined;

  return (
    <FeaturePageFrame>
      <ActionBar onCreate={() => setIsCreateOpen(true)} />

      {error ? <ErrorBanner message={error} /> : null}
      {isLoading ? <InlineLoader /> : null}

      <TokensGrid
        tokens={uiTokens}
        loading={isLoading}
        totalCount={totalCount}
        paginationModel={pagination}
        onPaginationModelChange={setPagination}
        onRefreshToken={onRefresh}
        onDeleteToken={onRequestDelete}
      />

      <CreateTokenModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateToken={onCreate}
      />

      <TokenDisplay
        open={newToken !== null}
        onClose={() => setNewToken(null)}
        token={newToken}
        title="Your New API Token"
      />

      <TokenDisplay
        open={refreshedToken !== null}
        onClose={() => setRefreshedToken(null)}
        token={refreshedToken}
        title="Your Refreshed API Token"
      />

      <DeleteConfirmDialog
        open={deleteTokenId !== null}
        onClose={() => setDeleteTokenId(null)}
        onConfirm={onConfirmDelete}
        itemType="token"
        itemName={selectedName}
      />
    </FeaturePageFrame>
  );
}