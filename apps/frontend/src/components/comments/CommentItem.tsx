'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Button,
  TextField,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  EditIcon,
  DeleteIcon,
  EmojiIcon,
  AssignmentIcon,
  AddTaskIcon,
} from '@/components/icons';
import { formatDistanceToNow, format } from 'date-fns';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { DeleteModal } from '@/components/common/DeleteModal';
import { UserAvatar } from '@/components/common/UserAvatar';
import { createReactionTooltipText } from '@/utils/comment-utils';
import { useTasksByCommentId } from '@/hooks/useTasks';
import {EntityType, Comment} from "@/api-client";

interface CommentItemProps {
  comment: Comment;
  onEdit: (commentId: string, newText: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReact: (commentId: string, emoji: string) => Promise<void>;
  onCreateTask?: (commentId: string) => void;
  currentUserId: string;
  entityType?: EntityType;
  isHighlighted?: boolean;
}

export function CommentItem({
                              comment,
                              onEdit,
                              onDelete,
                              onReact,
                              onCreateTask,
                              currentUserId,
                              entityType,
                              isHighlighted = false,
                            }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tasksQuery = useTasksByCommentId(comment.id, { limit: 50 });
  const associatedTasks = tasksQuery.data?.data ?? [];
  const isLoadingTasks = tasksQuery.isLoading;

  const isOwner = comment.user_id === currentUserId;
  const canEdit = isOwner;
  const canDelete = isOwner;

  const handleSaveEdit = async () => {
    const next = editText.trim();
    if (!next) return;
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, next);
      setIsEditing(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to edit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(comment.content);
    setIsEditing(false);
  };

  const handleDeleteClick = () => setShowDeleteModal(true);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
      setShowDeleteModal(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => setShowDeleteModal(false);

  const handleEmojiClick =async (emojiData: EmojiClickData) => {
    await onReact(comment.id, emojiData.emoji);
    setEmojiAnchorEl(null);
  };

  const openEmojiPicker = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const closeEmojiPicker = () => setEmojiAnchorEl(null);

  const formatDate = (dateString: string) => {
    // Treat backend timestamp as UTC
    const date = new Date(`${dateString}Z`);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true }).toUpperCase();
    }
    return format(date, 'dd MMM yyyy HH:mm').toUpperCase();
  };

  const taskCount = associatedTasks.length;

  return (
      <>
        <Box
            id={`comment-${comment.id}`}
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              alignItems: 'flex-start',
              ...(isHighlighted && {
                backgroundColor: 'primary.light',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                p: 2,
                mb: 3,
              }),
            }}
        >
          {/* User Avatar */}
           <UserAvatar
              userName={comment.user?.name??comment.user?.email??undefined}
              userPicture={comment.user?.picture?? undefined}
              size={40}
          />

          {/* Comment Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {comment.user?.name || 'UNKNOWN USER'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                  {formatDate(comment.created_at)}
                </Typography>
              </Box>

              {/* Actions + Task counter */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {taskCount > 0 && (
                    <Tooltip
                        title={`${taskCount} task${taskCount === 1 ? '' : 's'} created from this comment`}
                    >
                      <Chip
                          icon={<AddTaskIcon />}
                          label={taskCount}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            height: 24,
                            '& .MuiChip-icon': { fontSize: '0.875rem' },
                          }}
                      />
                    </Tooltip>
                )}

                {onCreateTask && entityType !== 'Task' && (
                    <Tooltip title="Create Task from Comment">
                      <IconButton
                          size="small"
                          onClick={() => onCreateTask(comment.id)}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}
                      >
                        <AssignmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                )}

                {canEdit && (
                    <Tooltip title="Edit comment">
                      <IconButton
                          size="small"
                          onClick={() => setIsEditing(true)}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                )}

                {canDelete && (
                    <Tooltip title="Delete comment">
                      <IconButton
                          size="small"
                          onClick={handleDeleteClick}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                )}
              </Box>
            </Box>

            {/* Body */}
            {isEditing ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={handleCancelEdit} sx={{ textTransform: 'none', borderRadius: '16px' }}>
                      Cancel
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={handleSaveEdit}
                        disabled={isSubmitting || !editText.trim()}
                        sx={{ textTransform: 'none', borderRadius: '16px' }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                </Box>
            ) : (
                <Typography
                    variant="body2"
                    sx={{ mt: 1, mb: 2, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'text.primary' }}
                >
                  {comment.content}
                </Typography>
            )}

            {/* Reactions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {Object.keys(comment.emojis || {}).length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {comment.emojis && Object.entries(comment.emojis).map(([emoji, reactions]) => {
                      const hasReacted = reactions.some((r) => r.user_id === currentUserId);
                      const reactionCount = reactions.length;
                      const tooltipText = createReactionTooltipText(reactions, emoji);

                      return (
                          <Tooltip key={emoji} title={tooltipText} arrow placement="top">
                            <Box
                                onClick={() => onReact(comment.id, emoji)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  bgcolor: 'background.default',
                                  color: 'text.primary',
                                  border: '1px solid',
                                  borderColor: hasReacted ? 'primary.main' : 'divider',
                                  borderRadius: (t) => t.shape.borderRadius * 4,
                                  px: 1.5,
                                  py: 0.75,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    color: 'text.primary',
                                    borderColor: hasReacted ? 'primary.main' : 'text.primary',
                                  },
                                }}
                            >
                              <Typography variant="subtitle1">{emoji}</Typography>
                              <Typography variant="body2" fontWeight={600} color="text.primary">
                                {reactionCount}
                              </Typography>
                            </Box>
                          </Tooltip>
                      );
                    })}
                  </Box>
              )}

              <IconButton
                  size="small"
                  onClick={openEmojiPicker}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  aria-label="add reaction"
              >
                <EmojiIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Associated Tasks */}
            {associatedTasks.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Associated Tasks:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {associatedTasks.map((task) => (
                        <Box
                            key={task.id}
                            onClick={() => window.open(`/tasks/${task.id}`, '_blank')}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              bgcolor: 'background.default',
                              color: 'text.primary',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              px: 1.5,
                              py: 0.75,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'action.hover',
                                color: 'text.primary',
                                borderColor: 'text.primary',
                              },
                            }}
                        >
                          <AddTaskIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {task.title}
                          </Typography>
                        </Box>
                    ))}
                  </Box>
                </Box>
            )}

            {/* Optional: show a subtle loading hint while fetching tasks */}
            {isLoadingTasks && associatedTasks.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Loading tasks…
                </Typography>
            )}
          </Box>

          {/* Emoji Picker */}
          <Popover
              open={Boolean(emojiAnchorEl)}
              anchorEl={emojiAnchorEl}
              onClose={closeEmojiPicker}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            {/* Library signature is (emojiData, event). We only need emojiData. */}
            <EmojiPicker onEmojiClick={(emojiData) => handleEmojiClick(emojiData)} />
          </Popover>
        </Box>

        {/* Delete Confirmation */}
        <DeleteModal
            open={showDeleteModal}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isLoading={isDeleting}
            itemType="comment"
        />
      </>
  );
}
