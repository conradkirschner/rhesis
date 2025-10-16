'use client';

import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { useNotifications } from '@/components/common/NotificationContext';

type Token = {
  access_token: string;
  name?: string | null;
  expires_at?: string | null;
};

interface TokenDisplayProps {
  open: boolean;
  onClose: () => void;
  token: Token | null;
}

export default function TokenDisplay({ open, onClose, token }: TokenDisplayProps) {
  const notifications = useNotifications();

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to fallback */
    }

    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyToken = async () => {
    if (!token?.access_token) return;
    const ok = await copyToClipboard(token.access_token);
    notifications.show(ok ? 'Token copied to clipboard!' : 'Failed to copy token to clipboard', {
      severity: ok ? 'success' : 'error',
    });
  };

  const expiresText =
      token?.expires_at ? new Date(token.expires_at).toLocaleDateString() : 'Never';

  return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CelebrationIcon color="primary" />
          Your New API Token
        </DialogTitle>

        <DialogContent>
          {token ? (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Token Name: {token.name ?? '—'}
                </Typography>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Expires: {expiresText}
                </Typography>
                <Typography color="warning.main" sx={{ mb: 2 }}>
                  Store this token securely — it won’t be shown again. If you lose it, you’ll need to
                  generate a new one.
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                      fullWidth
                      value={token.access_token}
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                      inputProps={{
                        'aria-label': 'API token value',
                        style: { fontFamily: 'monospace' },
                      }}
                  />
                  <IconButton
                      onClick={handleCopyToken}
                      color="primary"
                      aria-label="Copy token to clipboard"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
              </>
          ) : (
              <Typography color="text.secondary">No token to display.</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
  );
}
