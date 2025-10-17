'use client';

import * as React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import { Science as ScienceIcon, HorizontalSplit, PlayArrow } from '@mui/icons-material';
import type { UiFeaturePageFrameProps, UiFeatureSectionKind } from './types';

function SectionIcon({ kind }: { kind: UiFeatureSectionKind }) {
  if (kind === 'testSets') return <HorizontalSplit sx={{ verticalAlign: 'middle', mr: 1 }} />;
  if (kind === 'testRuns') return <PlayArrow sx={{ verticalAlign: 'middle', mr: 1 }} />;
  return <ScienceIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
}

export default function FeaturePageFrame({ charts, sections }: UiFeaturePageFrameProps) {
  return (
    <PageContainer>
      {charts}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {sections.map((s) => (
          <Grid key={s.key} item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <SectionIcon kind={s.kind} />
                {s.title}
              </Typography>
              {s.content}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
}