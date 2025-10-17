'use client';

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';

type Props = {
  readonly message: string;
  readonly onRetry: () => void;
  readonly onBack?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export default function ErrorBanner({ message, onRetry, onBack, ...divProps }: Props) {
  const [retrying, setRetrying] = useState(false);

  return (
    <Box sx={{ flexGrow: 1, pt: 3 }} {...divProps}>
      <Alert
        severity="error"
        sx={{ mb: 3 }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={async () => {
              setRetrying(true);
              try {
                await onRetry();
              } finally {
                setRetrying(false);
              }
            }}
            disabled={retrying}
            data-test-id="error-retry"
          >
            {retrying ? (
              <>
                <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                Retrying…
              </>
            ) : (
              'Retry'
            )}
          </Button>
        }
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Sorry, we couldn’t load this task
        </Typography>
        <Box
          sx={{
            fontSize: (t) => t.typography.helperText.fontSize,
            fontFamily: 'monospace',
            color: 'text.secondary',
            mt: 1,
          }}
        >
          Error: {message}
        </Box>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {onBack ? (
          <Button variant="contained" onClick={onBack} data-test-id="error-back">
            Back to Tasks
          </Button>
        ) : null}
        <Button variant="outlined" onClick={() => onRetry()} disabled={retrying} data-test-id="error-try-again">
          {retrying ? (
            <>
              <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
              Retrying…
            </>
          ) : (
            'Try Again'
          )}
        </Button>
      </Box>
    </Box>
  );
}