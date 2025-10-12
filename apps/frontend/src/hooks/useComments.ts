'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';

import type { Comment, EntityType } from '@/api-client/types.gen';

import {
  readCommentsByEntityCommentsEntityEntityTypeEntityIdGetOptions,
  createCommentCommentsPostMutation,
  updateCommentCommentsCommentIdPutMutation,
  deleteCommentCommentsCommentIdDeleteMutation,
  addEmojiReactionCommentsCommentIdEmojiEmojiPostMutation,
  removeEmojiReactionCommentsCommentIdEmojiEmojiDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface UseCommentsProps {
  entityType: string;
  entityId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserPicture?: string;
}

export function useComments({
                              entityType,
                              entityId,
                              currentUserId,
                            }: UseCommentsProps) {
  const qc = useQueryClient();
  const { show } = useNotifications();

  // Use the generator's options so we also use its queryKey
  const listOpts = useMemo(
      () =>
          readCommentsByEntityCommentsEntityEntityTypeEntityIdGetOptions({
            path: { entity_type: entityType, entity_id: entityId },
          }),
      [entityType, entityId]
  );

  const listQuery = useQuery({
    ...listOpts,
    enabled: Boolean(entityType && entityId),
  });

  const comments = useMemo<Comment[]>(
      () => ((listQuery.data as Comment[] | undefined) ?? []),
      [listQuery.data]
  );
  const isLoading = listQuery.isLoading;
  const error = listQuery.isError ? (listQuery.error as Error).message : null;

  // Revalidation helper that targets the exact generator key
  const revalidate = useCallback(
      async () => {
        await qc.invalidateQueries({ queryKey: listOpts.queryKey });
      },
      [qc, listOpts]
  );

  // Create
  const createMutation = useMutation({
    ...createCommentCommentsPostMutation(),
    onSuccess: async () => {
      show('Comment posted successfully', { severity: 'neutral' });
      await revalidate();
    },
    onError: (err) => {
      show((err as Error)?.message ?? 'Failed to create comment', { severity: 'error' });
    },
  });

  const createComment = useCallback(
      async (text: string) => {
        const res = await createMutation.mutateAsync({
          body: {
            content: text,
            entity_type: entityType as EntityType,
            entity_id: entityId,
          },
        } );
        return res as Comment;
      },
      [createMutation, entityType, entityId]
  );

  // Update
  const updateMutation = useMutation({
    ...updateCommentCommentsCommentIdPutMutation(),
    onSuccess: async () => {
      show('Comment updated successfully', { severity: 'neutral' });
      await revalidate();
    },
    onError: (err) => {
      show((err as Error)?.message ?? 'Failed to update comment', { severity: 'error' });
    },
  });

  const editComment = useCallback(
      async (commentId: string, newText: string) => {
        const res = await updateMutation.mutateAsync({
          path: { comment_id: commentId },
          body: { content: newText },
        } );
        return res as Comment;
      },
      [updateMutation]
  );

  // Delete
  const deleteMutation = useMutation({
    ...deleteCommentCommentsCommentIdDeleteMutation(),
    onSuccess: async () => {
      show('Comment deleted successfully', { severity: 'neutral' });
      await revalidate();
    },
    onError: (err) => {
      show((err as Error)?.message ?? 'Failed to delete comment', { severity: 'error' });
    },
  });

  const deleteComment = useCallback(
      async (commentId: string) => {
        await deleteMutation.mutateAsync({ path: { comment_id: commentId } } );
        return true;
      },
      [deleteMutation]
  );

  // Reactions
  const addReactionMutation = useMutation({
    ...addEmojiReactionCommentsCommentIdEmojiEmojiPostMutation(),
    onSuccess: revalidate,
    onError: (err) => {
      show((err as Error)?.message ?? 'Failed to add reaction', { severity: 'error' });
    },
  });

  const removeReactionMutation = useMutation({
    ...removeEmojiReactionCommentsCommentIdEmojiEmojiDeleteMutation(),
    onSuccess: revalidate,
    onError: (err) => {
      show((err as Error)?.message ?? 'Failed to remove reaction', { severity: 'error' });
    },
  });

  const reactToComment = useCallback(
      async (commentId: string, emoji: string) => {
        const current = comments.find((c) => c.id === commentId);
        const hasReacted = current?.emojis?.[emoji]?.some((r) => r.user_id === currentUserId);
        if (hasReacted) {
          await removeReactionMutation.mutateAsync({
            path: { comment_id: commentId, emoji }
          });
        } else {
          await addReactionMutation.mutateAsync({
            path: { comment_id: commentId, emoji }
          } );
        }
      },
      [comments, currentUserId, addReactionMutation, removeReactionMutation]
  );

  return {
    comments,
    isLoading,
    error,
    createComment,
    editComment,
    deleteComment,
    reactToComment,
    refetch: listQuery.refetch,
  };
}
