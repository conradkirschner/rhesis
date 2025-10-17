'use client';

import * as React from 'react';
import { Box, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrowOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import type { UiActionBarProps } from './types';

export default function ActionBar({ onExecute, onDownload }: UiActionBarProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Button
        data-test-id="execute-test-set"
        variant="contained"
        color="primary"
        startIcon={<PlayArrowIcon />}
        onClick={onExecute}
      >
        Execute Test Set
      </Button>
      <Button
        data-test-id="download-test-set"
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onDownload}
      >
        Download Test Set
      </Button>
    </Box>
  );
}