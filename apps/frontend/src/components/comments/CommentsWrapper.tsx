'use client';

import React from 'react';
import { CommentsSection } from './CommentsSection';
import { useComments } from '@/hooks/useComments';
import { EntityType } from '@/api-client';

interface CommentsWrapperProps {
  entityType: EntityType;
  entityId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserPicture?: string;
  onCreateTask?: (commentId: string) => void;
  onCreateTaskFromEntity?: () => void;
}

export default function CommentsWrapper({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
  currentUserPicture,
  onCreateTask,
  onCreateTaskFromEntity,
}: CommentsWrapperProps) {
  const {
    comments,
    isLoading,
    createComment,
    editComment,
    deleteComment,
    reactToComment,
  } = useComments({
    entityType,
    entityId,
    currentUserId,
    currentUserName,
    currentUserPicture,
  });

  // Wrap the functions to match the expected Promise<void> return type
  const handleCreateComment = async (text: string): Promise<void> => {
    await createComment(text);
  };

  const handleEditComment = async (
    commentId: string,
    newText: string
  ): Promise<void> => {
    await editComment(commentId, newText);
  };

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    await deleteComment(commentId);
  };

  const handleReactToComment = async (
    commentId: string,
    emoji: string
  ): Promise<void> => {
    await reactToComment(commentId, emoji);
  };

  return (
    <CommentsSection
      entityType={entityType}
      entityId={entityId}
      comments={comments}
      onCreateComment={handleCreateComment}
      onEditComment={handleEditComment}
      onDeleteComment={handleDeleteComment}
      onReactToComment={handleReactToComment}
      onCreateTask={onCreateTask}
      onCreateTaskFromEntity={onCreateTaskFromEntity}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserPicture={currentUserPicture}
      isLoading={isLoading}
    />
  );
}
