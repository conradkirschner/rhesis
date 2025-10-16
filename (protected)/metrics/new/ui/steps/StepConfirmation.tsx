import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { UiMetricForm, UiModelOption } from '../types';
import { useTheme } from '@mui/material/styles';

type Props = {
  readonly form: UiMetricForm;
  readonly models: readonly UiModelOption[];
};

export default function StepConfirmation({ form, models }: Props) {
  const theme = useTheme();
  const modelName = models.find((m) => m.id === form.model_id)?.name || 'No model selected';

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Review Your Metric
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          maxWidth: '1000px',
          mx: 'auto',
        }}
      >
        <Box>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              General Information
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Name
              </Typography>
              <Typography sx={{ color: 'text.primary' }}>{form.name}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Description
              </Typography>
              <Typography sx={{ color: 'text.primary' }}>
                {form.description || 'No description provided'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {form.tags.length > 0 ? (
                  form.tags.map((tag) => (
                    <Box
                      key={tag}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: (th) => th.shape.borderRadius * 0.25,
                        fontSize: theme.typography.helperText.fontSize,
                      }}
                    >
                      {tag}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    No tags added
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Evaluation Process
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Evaluation Model
              </Typography>
              <Typography sx={{ color: 'text.primary' }}>{modelName}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Evaluation Prompt
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mt: 1 }}>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: theme.typography.helperText.fontSize,
                    whiteSpace: 'pre-wrap',
                    color: 'text.primary',
                  }}
                >
                  {form.evaluation_prompt}
                </Typography>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                Reasoning Instructions
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: theme.typography.helperText.fontSize,
                    whiteSpace: 'pre-wrap',
                    color: 'text.primary',
                  }}
                >
                  {form.reasoning}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Evaluation Steps
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.evaluation_steps
                .map((s) => s.trim())
                .filter(Boolean)
                .map((step, index) => (
                  <Paper
                    key={`${index}-${step.slice(0, 12)}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      position: 'relative',
                      pl: 4,
                    }}
                  >
                    <Typography
                      sx={{
                        position: 'absolute',
                        left: 12,
                        top: 12,
                        color: 'primary.main',
                        fontWeight: 'bold',
                        fontSize: theme.typography.helperText.fontSize,
                      }}
                    >
                      {index + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {step}
                    </Typography>
                  </Paper>
                ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Result Configuration
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Score Type
              </Typography>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: (th) => th.shape.borderRadius * 0.25,
                  fontSize: theme.typography.helperText.fontSize,
                  display: 'inline-block',
                  mt: 0.5,
                }}
              >
                {form.score_type === 'binary' ? 'Binary (Pass/Fail)' : 'Numeric'}
              </Box>
            </Box>

            {form.score_type === 'numeric' && (
              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    Min Score
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: theme.typography.subtitle1.fontSize,
                      fontWeight: 500,
                      color: 'text.primary',
                    }}
                  >
                    {form.min_score}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    Max Score
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: theme.typography.subtitle1.fontSize,
                      fontWeight: 500,
                      color: 'text.primary',
                    }}
                  >
                    {form.max_score}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    Threshold
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: theme.typography.subtitle1.fontSize,
                      fontWeight: 500,
                      color: 'success.main',
                    }}
                  >
                    ≥ {form.threshold}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                Result Explanation
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: theme.typography.helperText.fontSize,
                    whiteSpace: 'pre-wrap',
                    color: 'text.primary',
                  }}
                >
                  {form.explanation}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}