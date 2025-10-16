'use client';

import dynamic from 'next/dynamic';
import { Box, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { StepTestConnectionProps } from '../types';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.23)',
        borderRadius: 1,
        bgcolor: 'action.hover',
      }}
    >
      Loading editor...
    </Box>
  ),
});

const wrapperSx = {
  border: '1px solid rgba(0,0,0,0.23)',
  borderRadius: 1,
};

export default function StepTestConnection({
  testInput,
  onChange,
  onTest,
  testResponse,
  isTesting,
}: StepTestConnectionProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Test your endpoint configuration with sample data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter sample JSON data that matches your request template structure
        </Typography>
        <Box sx={wrapperSx} data-test-id="test-input-editor">
          <Editor
            height="200px"
            defaultLanguage="json"
            value={testInput}
            onChange={(v) => onChange(v ?? '')}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              folding: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
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
          data-test-id="test-endpoint-btn"
        >
          Test Endpoint
        </LoadingButton>
      </Grid>

      {testResponse ? (
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Response
          </Typography>
          <Box sx={wrapperSx} data-test-id="test-response-editor">
            <Editor
              height="200px"
              defaultLanguage="json"
              value={testResponse}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'on',
                folding: true,
                scrollBeyondLastLine: false,
              }}
            />
          </Box>
        </Grid>
      ) : null}
    </Grid>
  );
}