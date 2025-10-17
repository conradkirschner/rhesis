'use client';

import {
  Box,
  Typography,
  Paper,
  Chip,
  Rating,
  TextField,
  Stack,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import StarIcon from '@mui/icons-material/StarOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { UiReviewSamplesProps, UiSample } from '../types';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const getLabelText = (value: number) => `${value} Star${value !== 1 ? 's' : ''}, ${RATING_LABELS[value]}`;

export function StepReviewSamples({
  samples,
  isGenerating,
  onSamplesChange,
  onLoadMore,
  onRegenerate,
}: UiReviewSamplesProps) {
  const updateSample = (id: number, updates: Partial<UiSample>) => {
    onSamplesChange(samples.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  if (isGenerating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <Typography>Generating test samples...</Typography>
      </Box>
    );
  }

  if (samples.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No samples generated yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box data-test-id="step-review-samples">
      <Typography variant="h6" gutterBottom>
        Evaluate Samples
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Rate each sample and provide feedback for improvements.
      </Typography>

      <Stack spacing={2}>
        {samples.map((sample) => (
          <Paper
            key={sample.id}
            sx={{
              p: 2,
              border: sample.rating === null ? '1px solid' : 'none',
              borderColor: 'warning.light',
              bgcolor: sample.rating === null ? 'warning.lighter' : 'inherit',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Chip
                label={sample.behavior}
                size="small"
                color={sample.behavior === 'Reliability' ? 'success' : 'warning'}
                variant="outlined"
              />
              <Chip label={sample.topic} size="small" variant="outlined" />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                  {sample.text}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    placeholder="What could be improved?"
                    value={sample.feedback}
                    onChange={(e) => updateSample(sample.id, { feedback: e.target.value })}
                    variant="standard"
                    size="small"
                    disabled={!sample.rating || sample.rating >= 4}
                    sx={{ flex: 1 }}
                    data-test-id={`feedback-${sample.id}`}
                  />

                  <LoadingButton
                    onClick={() => onRegenerate(sample.id)}
                    variant="outlined"
                    size="small"
                    startIcon={<AutorenewIcon />}
                    disabled={!sample.feedback || !sample.rating || sample.rating >= 4}
                    data-test-id={`regenerate-${sample.id}`}
                  >
                    Regenerate
                  </LoadingButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {sample.rating === null && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -30,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      border: 1,
                      borderColor: 'divider',
                      px: 1,
                      py: 0.5,
                      borderRadius: (t) => t.shape.borderRadius * 0.25,
                      fontSize: (t) => t.typography.caption.fontSize,
                      whiteSpace: 'nowrap',
                      zIndex: 1,
                      boxShadow: 1,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '4px solid',
                        borderTopColor: 'background.paper',
                      },
                    }}
                  >
                    Click to Rate
                  </Box>
                )}
                <Rating
                  value={sample.rating}
                  onChange={(_, value) => updateSample(sample.id, { rating: value ?? null, feedback: value && value >= 4 ? '' : sample.feedback })}
                  size="large"
                  getLabelText={getLabelText}
                  emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                />
                {sample.rating && (
                  <Typography variant="caption" color="text.secondary">
                    {RATING_LABELS[sample.rating]}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        ))}

        <LoadingButton
          onClick={onLoadMore}
          startIcon={<AutoFixHighIcon />}
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
          data-test-id="load-more-samples"
        >
          Load More Samples
        </LoadingButton>
      </Stack>
    </Box>
  );
}