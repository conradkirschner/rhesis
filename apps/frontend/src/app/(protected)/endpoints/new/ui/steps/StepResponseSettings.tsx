'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Box, Card, Grid, Typography } from '@mui/material';
import type { UiStepResponseSettingsProps } from '../types';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const editorWrapperStyle = {
  border: '1px solid rgba(0, 0, 0, 0.23)',
  borderRadius: '4px',
  '&:hover': { border: '1px solid rgba(0, 0, 0, 0.87)' },
  '&:focus-within': { border: '2px solid', borderColor: 'primary.main', margin: '-1px' },
};

export default function StepResponseSettings({
  response_mappings,
  onChange,
}: UiStepResponseSettingsProps) {
  return (
    <Card sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Response Mappings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Example: <code>{`{ "output": "$.choices[0].message.content" }`}</code>
          </Typography>
          <Box sx={editorWrapperStyle}>
            <Editor
              height="200px"
              defaultLanguage="json"
              value={response_mappings}
              onChange={(v) => onChange('response_mappings', v ?? '')}
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