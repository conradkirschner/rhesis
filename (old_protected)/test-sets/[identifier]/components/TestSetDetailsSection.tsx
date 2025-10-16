'use client';

import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrowOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import DocumentIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import CheckIcon from '@mui/icons-material/CheckOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';

import ExecuteTestSetDrawer from './ExecuteTestSetDrawer';
import TestSetTags from './TestSetTags';

import type {TestSet} from '@/api-client/types.gen';

import { updateTestSetTestSetsTestSetIdPutMutation } from '@/api-client/@tanstack/react-query.gen';

interface TestSetDetailsSectionProps {
  testSet: TestSet;
  sessionToken: string;
}

interface MetadataFieldProps {
  label: string;
  items: string[];
  maxVisible?: number;
}

function MetadataField({ label, items, maxVisible = 20 }: MetadataFieldProps) {
  if (!items || items.length === 0) {
    return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No {label.toLowerCase()} defined
          </Typography>
        </Box>
    );
  }

  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {visibleItems.map((item, index) => (
              <Chip key={index} label={item} variant="outlined" size="small" />
          ))}
          {remainingCount > 0 && (
              <Chip
                  label={`+${remainingCount}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
              />
          )}
        </Box>
      </Box>
  );
}

export default function TestSetDetailsSection({
                                                testSet,
                                                sessionToken,
                                              }: TestSetDetailsSectionProps) {
  const theme = useTheme();
  const { data: session } = useSession();

  const [testRunDrawerOpen, setTestRunDrawerOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(testSet.description ?? '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(testSet.name ?? '');


  // ---- Update mutation (name + description)
  const updateMutation = useMutation({
    ...updateTestSetTestSetsTestSetIdPutMutation(),
    onSuccess: () => {
      // keep behavior consistent with previous code:
      // - close editors
      // - refresh title area if name changed
      if (isEditingDescription) setIsEditingDescription(false);
      if (isEditingTitle) {
        setIsEditingTitle(false);
        // breadcrumb/title refresh
        window.location.reload();
      }
    },
    onError: (err) => {
      console.error('Error updating test set:', err);
      // reset edited values on error
      setEditedDescription(testSet.description ?? '');
      setEditedTitle(testSet.name ?? '');
    },
  });

  const downloadMutation = useMutation({
    mutationKey: ['test-sets', testSet.id, 'download'],
    mutationFn: async () => {
      const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}/test-sets/${encodeURIComponent(
              testSet.id as string,
          )}/download`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${sessionToken}` },
            credentials: 'include',
          },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Download failed: ${res.status} ${text}`);
      }
      return res.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test_set_${testSet.id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (err) => {
      console.error('Error downloading test set:', err);
    },
  });

  const handleEditDescription = useCallback(() => setIsEditingDescription(true), []);
  const handleEditTitle = useCallback(() => setIsEditingTitle(true), []);
  const handleCancelEdit = useCallback(() => {
    setIsEditingDescription(false);
    setEditedDescription(testSet.description ?? '');
  }, [testSet.description]);
  const handleCancelTitleEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle(testSet.name ?? '');
  }, [testSet.name]);

  const handleConfirmEdit = useCallback(() => {
    if (!sessionToken) return;
    updateMutation.mutate({
      path: { test_set_id: testSet.id as string },
      body: { description: editedDescription },
    });
  }, [editedDescription, sessionToken, testSet.id, updateMutation]);

  const handleConfirmTitleEdit = useCallback(() => {
    if (!sessionToken) return;
    updateMutation.mutate({
      path: { test_set_id: testSet.id as string },
      body: { name: editedTitle },
    });
  }, [editedTitle, sessionToken, testSet.id, updateMutation]);

  const handleDownloadTestSet = useCallback(() => {
    if (!sessionToken) return;
    downloadMutation.mutate();
  }, [downloadMutation, sessionToken]);


  const behaviors = (testSet.attributes?.metadata?.behaviors ?? []);
  const categories = (testSet.attributes?.metadata?.categories ?? []);
  const topics = (testSet.attributes?.metadata?.topics ?? []);
  const sources = (testSet.attributes?.metadata?.sources ?? []);

  const isUpdating = updateMutation.isPending;
  const isDownloading = downloadMutation.isPending;
  if (!session) return null;

  return (
      <>
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }} suppressHydrationWarning>
          <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => setTestRunDrawerOpen(true)}
          >
            Execute Test Set
          </Button>
          <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTestSet}
              disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download Test Set'}
          </Button>
        </Box>

        {/* Test Set Details */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Test Set Details
          </Typography>

          {/* Name Field */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Name
          </Typography>
          {isEditingTitle ? (
              <TextField
                  fullWidth
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleConfirmTitleEdit();
                    }
                  }}
                  sx={{ mb: 2 }}
                  autoFocus
              />
          ) : (
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      bgcolor: 'action.hover',
                      borderRadius: theme => theme.shape.borderRadius * 0.25,
                      p: 1,
                      pr: theme.spacing(10),
                      wordBreak: 'break-word',
                      minHeight: 'calc(2 * 1.4375em + 2 * 8px)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                >
                  {editedTitle}
                </Typography>
                <Button
                    startIcon={<EditIcon />}
                    onClick={handleEditTitle}
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
              </Box>
          )}

          {/* Title Edit Actions */}
          {isEditingTitle && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 3 }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelTitleEdit}
                    disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={handleConfirmTitleEdit}
                    disabled={isUpdating}
                >
                  Confirm
                </Button>
              </Box>
          )}

          {/* Description Field */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Description
          </Typography>
          {isEditingDescription ? (
              <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editedDescription}
                  onChange={e => setEditedDescription(e.target.value)}
                  sx={{ mb: 1 }}
                  autoFocus
              />
          ) : (
              <Box sx={{ position: 'relative' }}>
                <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      bgcolor: 'action.hover',
                      borderRadius: theme => theme.shape.borderRadius * 0.25,
                      p: 1,
                      minHeight: 'calc(4 * 1.4375em + 2 * 8px)',
                      pr: theme.spacing(10),
                      wordBreak: 'break-word',
                    }}
                >
                  {testSet.description || ' '}
                </Typography>
                <Button
                    startIcon={<EditIcon />}
                    onClick={handleEditDescription}
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
              </Box>
          )}
        </Box>

        {isEditingDescription && (
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
                  disabled={isUpdating}
              >
                Confirm
              </Button>
            </Box>
        )}

        {/* Metadata Fields */}
        <Box sx={{ mb: 3 }}>
          <MetadataField label="Behaviors" items={behaviors} />
          <MetadataField label="Categories" items={categories} />
          <MetadataField label="Topics" items={topics} />
        </Box>

        {/* Source Documents Section */}
        {sources.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Source Documents
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sources.map((source, index) => (
                    <Box
                        key={`${source.document ?? source.name ?? 'doc'}-${index}`}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: theme => theme.shape.borderRadius * 0.25,
                          backgroundColor: 'background.paper',
                        }}
                    >
                      <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                      >
                        <DocumentIcon sx={{ fontSize: 'inherit' }} />
                        {source.name ?? source.document ?? 'Unknown Document'}
                      </Typography>
                      {source.description && (
                          <Typography variant="body2" color="text.secondary">
                            {source.description}
                          </Typography>
                      )}
                      {source.document && source.document !== source.name && (
                          <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                          >
                            File: {source.document}
                          </Typography>
                      )}
                    </Box>
                ))}
              </Box>
            </Box>
        )}

        {/* Tags Section */}
        <TestSetTags testSet={testSet} />

        <ExecuteTestSetDrawer
            open={testRunDrawerOpen}
            onClose={() => setTestRunDrawerOpen(false)}
            testSetId={testSet.id as string}
            sessionToken={sessionToken}
        />
      </>
  );
}
