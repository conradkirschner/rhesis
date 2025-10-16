'use client';

import { Box, Typography, Paper, Grid, Chip, Stack, Rating, Alert, AlertTitle } from '@mui/material';
import type { UiConfirmGenerateProps } from '../types';

export function StepConfirmGenerate({
  samples,
  configData,
  documents,
  averageRating,
}: UiConfirmGenerateProps) {
  return (
    <Box data-test-id="step-confirm-generate">
      <Typography variant="h6" gutterBottom>
        Confirm Test Generation
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Configuration Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Project
            </Typography>
            <Typography variant="body1" gutterBottom>
              {configData.project_name || 'Not set'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Behaviors
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {configData.behaviors.map((name) => (
                <Chip key={name} label={name} size="small" />
              ))}
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Topics
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {configData.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>

            {documents.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Documents
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {documents.map((doc) => (
                    <Chip key={doc.id} label={doc.name} size="small" variant="outlined" />
                  ))}
                </Stack>
              </>
            )}
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Average Rating
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={Number.isNaN(Number(averageRating)) ? 0 : Number(averageRating)} precision={0.1} readOnly size="small" />
              <Typography variant="body2">({averageRating})</Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Rated Samples
            </Typography>
            <Typography variant="body1">{samples.filter((s) => s.rating !== null).length}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Alert severity="info">
        <AlertTitle>What happens next?</AlertTitle>
        When you click &quot;Generate Tests&quot;, we&apos;ll create your test suite and notify you when ready.
      </Alert>
    </Box>
  );
}