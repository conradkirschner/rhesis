'use client';

import { Box, Button, Checkbox, Divider, FormControlLabel, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import AppleIcon from '@mui/icons-material/Apple';
import MicrosoftIcon from '@mui/icons-material/Window';
import type { UiLoginSectionProps } from './types';

export default function LoginSection(props: UiLoginSectionProps) {
  const {
    termsAccepted,
    previouslyAccepted,
    showTermsWarning,
    onToggleTerms,
    onLogin,
  } = props;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" sx={{ mb: 2 }}>
        All paws on deck for testing!
      </Typography>

      <Button
        variant="contained"
        fullWidth
        size="medium"
        onClick={() => onLogin('email')}
        data-test-id="auth-email-button"
      >
        Sign in with Email
      </Button>

      <Divider sx={{ my: 2 }}>
        <Typography color="textSecondary" variant="body2">
          Or continue with
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="outlined"
          fullWidth
          size="medium"
          startIcon={<GoogleIcon />}
          onClick={() => onLogin('google-oauth2')}
          data-test-id="auth-google-button"
          sx={{ color: theme => theme.palette.text.primary }}
        >
          Continue with Google
        </Button>

        <Button
          variant="outlined"
          fullWidth
          size="medium"
          startIcon={<GitHubIcon />}
          onClick={() => onLogin('github')}
          data-test-id="auth-github-button"
          sx={{ color: theme => theme.palette.text.primary }}
        >
          Continue with GitHub
        </Button>

        <Button
          variant="outlined"
          fullWidth
          size="medium"
          startIcon={<AppleIcon />}
          onClick={() => onLogin('apple')}
          data-test-id="auth-apple-button"
          sx={{ color: theme => theme.palette.text.primary }}
        >
          Continue with Apple
        </Button>

        <Button
          variant="outlined"
          fullWidth
          size="medium"
          startIcon={<MicrosoftIcon />}
          onClick={() => onLogin('windowslive')}
          data-test-id="auth-microsoft-button"
          sx={{ color: theme => theme.palette.text.primary }}
        >
          Continue with Microsoft
        </Button>

        {showTermsWarning ? (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Please accept the Terms and Conditions to continue.
          </Typography>
        ) : null}

        {previouslyAccepted ? (
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 1, color: 'text.secondary' }}
          >
            By continuing, you confirm your agreement to our{' '}
            <a
              href="https://www.rhesis.ai/terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              Terms and Conditions
            </a>{' '}
            &amp;{' '}
            <a
              href="https://www.rhesis.ai/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              Privacy Policy
            </a>
            .
          </Typography>
        ) : (
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={e => onToggleTerms(e.target.checked)}
                color="primary"
                data-test-id="auth-terms-checkbox"
              />
            }
            label={
              <Typography variant="body2">
                By signing in you are agreeing to our{' '}
                <a
                  href="https://www.rhesis.ai/terms-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit' }}
                >
                  Terms and Conditions
                </a>{' '}
                &amp;{' '}
                <a
                  href="https://www.rhesis.ai/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit' }}
                >
                  Privacy Policy
                </a>
                .
              </Typography>
            }
            sx={{ mt: 1 }}
          />
        )}
      </Box>
    </Box>
  );
}