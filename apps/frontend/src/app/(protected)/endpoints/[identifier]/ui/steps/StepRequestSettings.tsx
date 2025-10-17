'use client';

import dynamic from 'next/dynamic';
import { Box, Grid, Typography } from '@mui/material';
import type { StepRequestSettingsProps } from '../types';

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

export default function StepRequestSettings({
  isEditing,
  requestHeaders,
  requestBodyTemplate,
  onChange,
}: StepRequestSettingsProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Request Headers
        </Typography>
        <Box sx={wrapperSx} data-test-id="request-headers-editor">
          <Editor
            height="200px"
            defaultLanguage="json"
            value={requestHeaders}
            onChange={(v) => onChange({ requestHeaders: v ?? '' })}
            options={{
              readOnly: !isEditing,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
            }}
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Request Body Template
        </Typography>
        <Box sx={wrapperSx} data-test-id="request-body-template-editor">
          <Editor
            height="300px"
            defaultLanguage="json"
            value={requestBodyTemplate}
            onChange={(v) => onChange({ requestBodyTemplate: v ?? '' })}
            options={{
              readOnly: !isEditing,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
            }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}