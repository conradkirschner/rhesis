'use client';

import * as React from 'react';
import { Breadcrumbs, Link, Stack, Typography, Box, Divider } from '@mui/material';
import type { UiFeaturePageFrameProps } from './types';

export default function FeaturePageFrame({ title, breadcrumbs, children }: UiFeaturePageFrameProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Breadcrumbs aria-label="breadcrumbs">
          {breadcrumbs.map((bc, idx) =>
            idx < breadcrumbs.length - 1 ? (
              <Link key={bc.path} href={bc.path} underline="hover" color="inherit">
                {bc.title}
              </Link>
            ) : (
              <Typography key={bc.path} color="text.primary">
                {bc.title}
              </Typography>
            ),
          )}
        </Breadcrumbs>
        <Typography variant="h4" sx={{ mt: 1 }}>
          {title}
        </Typography>
      </Box>
      <Divider />
      <Box>{children}</Box>
    </Stack>
  );
}