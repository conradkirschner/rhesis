import { Box, Fade, Paper, Typography, useTheme } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ActionBar from '../ActionBar';
import type { UiStepCredentialsProps } from '../types';

export default function StepCredentials({
  email,
  password,
  onContinue,
}: UiStepCredentialsProps) {
  const theme = useTheme();

  return (
    <Fade in timeout={1000}>
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
          Ready to explore? Here are your demo credentials:
        </Typography>

        <Paper
          elevation={2}
          sx={{
            p: 4,
            mt: 2,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}
          >
            Demo login credentials
          </Typography>
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 3,
              borderRadius: theme.shape.borderRadius * 0.5,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body1" sx={{ fontFamily: 'monospace', lineHeight: 1.8 }}>
              <strong>Email:</strong> {email}
              <br />
              <strong>Password:</strong> {password}
            </Typography>
          </Box>
        </Paper>

        <Typography
          variant="body2"
          sx={{
            mt: 4,
            mb: 4,
            p: 2,
            bgcolor: 'background.light2',
            color: 'text.primary',
            borderRadius: theme.shape.borderRadius * 0.5,
            border: `1px solid ${theme.palette.divider}`,
            fontWeight: 'medium',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <WarningAmberIcon sx={{ color: 'warning.main', mt: 0.2, flexShrink: 0 }} />
            <span>
              Demo Account Notice: Please do not add any real or sensitive data to this
              demo account. All data may be visible to other users and will be regularly
              reset.
            </span>
          </Box>
        </Typography>

        <ActionBar
          primaryLabel="Continue to Demo Login"
          onPrimary={onContinue}
          data-test-id="continue-to-demo"
        />
      </Box>
    </Fade>
  );
}