'use client';

import { Box } from '@mui/material';
import CustomAuthForm from './Auth0Lock';

export default function LoginSection() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width: '100%',
      }}
    >
      <Box sx={{ width: '100%' }}>
        <CustomAuthForm />
      </Box>
    </Box>
  );
}
