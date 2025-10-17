'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  Button,
  CircularProgress,
  TextField,
  FormHelperText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import type { UiUploadDocumentsProps } from '../types';

const SUPPORTED_FILE_EXTENSIONS = [
  '.docx',
  '.pptx',
  '.xlsx',
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.zip',
  '.epub',
] as const;

export function StepUploadDocuments({ documents, onFilesSelected, onDocumentUpdate, onDocumentRemove }: UiUploadDocumentsProps) {
  const canProceed = documents.length === 0 || documents.every((doc) => doc.status === 'completed');

  return (
    <Box data-test-id="step-upload-documents">
      <Typography variant="h6" gutterBottom>
        Upload Documents
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select documents to add context to test generation (optional).
      </Typography>

      <Box sx={{ mb: 3 }}>
        <input
          type="file"
          multiple
          onChange={(e) => onFilesSelected(e.target.files)}
          style={{ display: 'none' }}
          id="document-upload"
          accept={SUPPORTED_FILE_EXTENSIONS.join(',')}
        />
        <label htmlFor="document-upload">
          <LoadingButton
            component="span"
            variant="contained"
            startIcon={<UploadFileIcon />}
            disabled={!canProceed}
            data-test-id="select-documents-btn"
          >
            Select Documents
          </LoadingButton>
        </label>
        <FormHelperText>
          Supported formats: {SUPPORTED_FILE_EXTENSIONS.join(', ')} • Maximum file size: 5 MB
        </FormHelperText>
      </Box>

      {documents.length > 0 && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {documents.map((doc) => (
            <Paper key={doc.id} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1">{doc.originalName}</Typography>
                    <Chip
                      label={doc.status}
                      color={doc.status === 'completed' ? 'success' : doc.status === 'error' ? 'error' : 'info'}
                      size="small"
                    />
                    {doc.status !== 'uploading' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDocumentRemove(doc.id)}
                        data-test-id={`remove-doc-${doc.id}`}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>

                  {doc.status === 'completed' && (
                    <>
                      <TextField
                        fullWidth
                        label="Name"
                        value={doc.name}
                        onChange={(e) => onDocumentUpdate(doc.id, 'name', e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                        data-test-id={`doc-name-${doc.id}`}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description"
                        value={doc.description}
                        onChange={(e) => onDocumentUpdate(doc.id, 'description', e.target.value)}
                        size="small"
                        data-test-id={`doc-description-${doc.id}`}
                      />
                    </>
                  )}

                  {doc.status !== 'completed' && doc.status !== 'error' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {doc.status === 'uploading' && 'Uploading...'}
                        {doc.status === 'extracting' && 'Extracting content...'}
                        {doc.status === 'generating' && 'Generating metadata...'}
                      </Typography>
                    </Box>
                  )}

                  {doc.status === 'error' && (
                    <Typography color="error" sx={{ mt: 1 }}>
                      Failed to process this document. Please try uploading again.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}