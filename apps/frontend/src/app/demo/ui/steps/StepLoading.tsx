import { Box, CircularProgress, Fade, Typography } from '@mui/material';

export default function StepLoading() {
  return (
    <Fade in timeout={1500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={48} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="textSecondary">
          Preparing your demo experience...
        </Typography>
      </Box>
    </Fade>
  );
}