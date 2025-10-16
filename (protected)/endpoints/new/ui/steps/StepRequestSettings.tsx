'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Box, Card, Grid, Typography } from '@mui/material';
import type { UiStepRequestSettingsProps } from '../types';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const editorWrapperStyle = {
  border: '1px solid rgba(0, 0, 0, 0.23)',
  borderRadius: '4px',
  '&:hover': { border: '1px solid rgba(0, 0, 0, 0.87)' },
  '&:focus-within': { border: '2px solid', borderColor: 'primary.main', margin: '-1px' },
};

export default function StepRequestSettings({
  request_headers,
  request_body_template,
  onChange,
}: UiStepRequestSettingsProps) {
  return (
    <Card sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Request Headers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Example:
            <code>{` { "Authorization": "Bearer {API_KEY}", "Content-Type": "application/json" } `}</code>
          </Typography>
          <Box sx={editorWrapperStyle}>
            <Editor
              height="200px"
              defaultLanguage="json"
              value={request_headers}
              onChange={(v) => onChange('request_headers', v ?? '')}
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
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Request Body Template
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Example:
            <code>{` { "messages": [{ "role": "user", "content": "{user_input}" }], "temperature": 0.7 } `}</code>
          </Typography>
          <Box sx={editorWrapperStyle}>
            <Editor
              height="300px"
              defaultLanguage="json"
              value={request_body_template}
              onChange={(v) => onChange('request_body_template', v ?? '')}
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
      </Grid>
    </Card>
  );
}