import { Fade, Grow, Paper, Box, useTheme } from '@mui/material';
import Image from 'next/image';
import type { PropsWithChildren } from 'react';
import type { UiDemoFrameProps } from './types';

export default function FeaturePageFrame(props: PropsWithChildren<UiDemoFrameProps>) {
  const { showBackground, children } = props;
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.light1',
        p: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Fade in={showBackground} timeout={1500}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '75%',
            height: '100%',
            zIndex: 0,
            opacity: 0.3,
          }}
        >
          <Image
            src="/elements/rhesis-brand-element-18.svg"
            alt="Background element"
            fill
            style={{ objectFit: 'cover', objectPosition: 'left center' }}
          />
        </Box>
      </Fade>

      <Grow in timeout={1200}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 4, sm: 6 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 3, sm: 4 },
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            borderRadius: theme.shape.borderRadius,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </Paper>
      </Grow>
    </Box>
  );
}