'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';

import {
  updatePromptPromptsPromptIdPutMutation,
  readPromptPromptsPromptIdGetOptions,
  readTestTestsTestIdGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

interface TestExecutableFieldProps {
  /** prompt id to update; if absent, editing is disabled */
  promptId?: string;
  /** optional test id, if provided we also invalidate the test detail query */
  testId?: string;
  initialContent: string;
  onUpdate?: () => void;
  fieldName?: 'content' | 'expected_response';
}

export default function TestExecutableField({
                                              promptId,
                                              testId,
                                              initialContent,
                                              onUpdate,
                                              fieldName = 'content',
                                            }: TestExecutableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(initialContent);
  const { show: showNotification } = useNotifications();

  useEffect(() => {
    if (!isEditing) setEditedContent(initialContent);
  }, [initialContent, isEditing]);

  const displayRows = 4;
  const lineHeight = '1.4375em';
  const boxPadding = '8px';
  const displayMinHeight = `calc(${displayRows} * ${lineHeight} + 2 * ${boxPadding})`;
  const editButtonSpace = '80px';

  const canEdit = Boolean(promptId);
  const trimmedContent = useMemo(() => editedContent.trim(), [editedContent]);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    ...updatePromptPromptsPromptIdPutMutation(),
    onSuccess: async () => {
      const tasks: Array<Promise<unknown>> = [];

      if (promptId) {
        tasks.push(
            queryClient.invalidateQueries({
              queryKey: readPromptPromptsPromptIdGetOptions({
                path: { prompt_id: promptId },
              }).queryKey,
            }),
        );
      }

      // to refetch the main component we need to invalidate the whole test
      if (testId) {
        tasks.push(
            queryClient.invalidateQueries({
              queryKey: readTestTestsTestIdGetOptions({
                path: { test_id: testId },
              }).queryKey,
            }),
        );
      }

      if (tasks.length) {
        await Promise.all(tasks);
      }
    },
  });

  const isUpdating = updateMutation.isPending;
  const confirmDisabled = !canEdit || isUpdating || trimmedContent === initialContent;

  const handleEdit = () => {
    if (!canEdit) {
      showNotification('No prompt available to edit.', { severity: 'info' });
      return;
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(initialContent);
  };

  const handleConfirmEdit = async () => {
    if (!promptId) {
      showNotification('Missing prompt id', { severity: 'error' });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        path: { prompt_id: promptId },
        body: {
          [fieldName]: trimmedContent,
          language_code: 'en',
        },
      });

      setIsEditing(false);
      showNotification(`Successfully updated test ${fieldName.replace('_', ' ')}`, {
        severity: 'success',
      });
      onUpdate?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error updating test ${fieldName}:`, error);
      showNotification(`Failed to update test ${fieldName.replace('_', ' ')}`, {
        severity: 'error',
      });
    }
  };

  return (
      <Box sx={{ position: 'relative' }}>
        {isEditing ? (
            <TextField
                fullWidth
                multiline
                rows={displayRows}
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                sx={{ mb: 1 }}
                autoFocus
            />
        ) : (
            <Typography
                component="pre"
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  bgcolor: 'action.hover',
                  borderRadius: theme => theme.shape.borderRadius * 0.25,
                  padding: boxPadding,
                  minHeight: displayMinHeight,
                  paddingRight: editButtonSpace,
                  wordBreak: 'break-word',
                  opacity: canEdit ? 1 : 0.7,
                }}
            >
              {initialContent || ' '}
            </Typography>
        )}

        {!isEditing ? (
            <Button
                startIcon={<EditIcon />}
                onClick={handleEdit}
                disabled={!canEdit}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                          ? 'rgba(0, 0, 0, 0.6)'
                          : 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    backgroundColor: theme =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(0, 0, 0, 0.8)'
                            : 'rgba(255, 255, 255, 0.9)',
                  },
                }}
            >
              Edit
            </Button>
        ) : (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={handleConfirmEdit}
                  disabled={confirmDisabled}
              >
                Confirm
              </Button>
            </Box>
        )}
      </Box>
  );
}
