'use client';

import * as React from 'react';
import { PageContainer } from '@toolpad/core/PageContainer';
import { Box, Paper, Typography } from '@mui/material';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function FeaturePageFrame({ title, children }: Props) {
  return (
    <PageContainer title={title}>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Box>{children instanceof Array ? children[0] : children}</Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Contact Information
          </Typography>
          <Box>{children instanceof Array ? children[1] : null}</Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Domain Settings
          </Typography>
          <Box>{children instanceof Array ? children[2] : null}</Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Subscription
          </Typography>
          <Box>{children instanceof Array ? children[3] : null}</Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box>{children instanceof Array ? children[4] : null}</Box>
        </Paper>
      </Box>
    </PageContainer>
  );
}