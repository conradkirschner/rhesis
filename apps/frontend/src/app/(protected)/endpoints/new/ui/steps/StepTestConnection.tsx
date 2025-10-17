'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Box, Card, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import type { UiStepTestConnectionProps } from '../types';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const editorWrapperStyle = {
  border: '1px solid rgba(0, 0, 0, 0.23)',
  borderRadius: '4px',
  '&:hover': { border: '1px solid rgba(0, 0, 0, 0.87)' },
  '&:focus-within': { border: '2px solid', borderColor: 'primary.main', margin: '-1px' },
};

export default function StepTestConnection({ isTesting, response, onTest }: UiStepTestConnectionProps) {
  return (
    <Card sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Test your endpoint configuration with sample data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter sample JSON data that matches your request template structure
          </Typography>
          <Box sx={editorWrapperStyle}>
            <Editor
              height="200px"
              defaultLanguage="json"
              defaultValue={`{\n  "input": "[place your input here]"\n}`}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                folding: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                padding: { top: 8, bottom: 8 },
                scrollbar: { vertical: 'visible', horizontal: 'visible' },
                fontSize: 14,
                theme: 'light',
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sx={{ mt: 2 }}>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={onTest}
            loading={isTesting}
            loadingPosition="start"
            startIcon={<PlayArrowIcon />}
            data-test-id="test-endpoint-button"
          >
            Test Endpoint
          </LoadingButton>
        </Grid>

        {response && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Response
            </Typography>
            <Box sx={editorWrapperStyle}>
              <Editor
                height="200px"
                defaultLanguage="json"
                value={response}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  folding: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  readOnly: true,
                  padding: { top: 8, bottom: 8 },
                  scrollbar: { vertical: 'visible', horizontal: 'visible' },
                  fontSize: 14,
                  theme: 'light',
                }}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Card>
  );
}