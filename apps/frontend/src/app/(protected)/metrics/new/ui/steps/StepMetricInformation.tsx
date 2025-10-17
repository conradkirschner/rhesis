import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BaseTag from '@/components/common/BaseTag';
import { useTheme } from '@mui/material/styles';
import type { UiMetricForm, UiModelOption, UiScoreType } from '../types';

type Props = {
  readonly form: UiMetricForm;
  readonly models: readonly UiModelOption[];
  readonly isLoadingModels: boolean;
  readonly onFieldChange: <K extends keyof UiMetricForm>(key: K, value: UiMetricForm[K]) => void;
  readonly onStepChange: (index: number, value: string) => void;
  readonly onAddStep: () => void;
  readonly onRemoveStep: (index: number) => void;
};

export default function StepMetricInformation({
  form,
  models,
  isLoadingModels,
  onFieldChange,
  onStepChange,
  onAddStep,
  onRemoveStep,
}: Props) {
  const theme = useTheme();

  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          General Information
        </Typography>
        <TextField
          fullWidth
          required
          label="Name"
          placeholder="e.g. Helpfulness"
          value={form.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          helperText="Your custom metric name is for identification and must be unique."
          sx={{ mb: 3 }}
          inputProps={{ 'data-test-id': 'field-name' }}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={form.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          helperText="Describe what this metric evaluates and its purpose."
          sx={{ mb: 3 }}
          inputProps={{ 'data-test-id': 'field-description' }}
        />

        <BaseTag
          value={[...form.tags]}
          onChange={(newTags) => onFieldChange('tags', newTags)}
          label="Tags"
          placeholder="Add tags (press Enter or comma to add)"
          helperText="Add relevant tags to organize this metric"
          chipColor="primary"
          addOnBlur
          delimiters={[',', 'Enter']}
          size="small"
          data-test-id="field-tags"
        />
      </Box>

      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Evaluation Process
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel required>Evaluation Model</InputLabel>
          <Select
            value={form.model_id}
            label="Evaluation Model"
            onChange={(e) => onFieldChange('model_id', e.target.value)}
            data-test-id="field-model"
          >
            {isLoadingModels ? (
              <MenuItem disabled>Loading models...</MenuItem>
            ) : models.length === 0 ? (
              <MenuItem disabled>No models available</MenuItem>
            ) : (
              models.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  <Box>
                    <Typography variant="subtitle2">{m.name}</Typography>
                    {m.description ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {m.description}
                      </Typography>
                    ) : null}
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          required
          multiline
          rows={3}
          label="Evaluation Prompt"
          value={form.evaluation_prompt}
          onChange={(e) => onFieldChange('evaluation_prompt', e.target.value)}
          helperText="Main prompt guiding the evaluation process."
          sx={{ mb: 3 }}
          inputProps={{ 'data-test-id': 'field-evaluation-prompt' }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Evaluation Steps
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Break down the evaluation into clear, sequential steps.
        </Typography>
        {form.evaluation_steps.map((step, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              required
              multiline
              rows={2}
              label={`Step ${index + 1}`}
              placeholder="Describe this evaluation step..."
              value={step}
              onChange={(e) => onStepChange(index, e.target.value)}
              inputProps={{ 'data-test-id': `field-step-${index}` }}
            />
            <IconButton
              onClick={() => onRemoveStep(index)}
              disabled={form.evaluation_steps.length === 1}
              sx={{ mt: 1 }}
              data-test-id={`remove-step-${index}`}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button startIcon={<AddIcon />} onClick={onAddStep} sx={{ mb: 3 }} data-test-id="add-step">
          Add Step
        </Button>

        <TextField
          fullWidth
          required
          multiline
          rows={3}
          label="Reasoning Instructions"
          value={form.reasoning}
          onChange={(e) => onFieldChange('reasoning', e.target.value)}
          helperText="Instructions for how the evaluation should be reasoned."
          sx={{ mb: 3 }}
          inputProps={{ 'data-test-id': 'field-reasoning' }}
        />
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Result Configuration
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel required>Score Type</InputLabel>
          <Select
            value={form.score_type}
            label="Score Type"
            onChange={(e) => onFieldChange('score_type', e.target.value as UiScoreType)}
            data-test-id="field-score-type"
          >
            <MenuItem value="binary">Binary (Pass/Fail)</MenuItem>
            <MenuItem value="numeric">Numeric</MenuItem>
          </Select>
        </FormControl>

        {form.score_type === 'numeric' && (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                required
                type="number"
                label="Minimum Score"
                value={form.min_score ?? ''}
                onChange={(e) => onFieldChange('min_score', e.target.value === '' ? undefined : Number(e.target.value))}
                fullWidth
                inputProps={{ 'data-test-id': 'field-min-score' }}
              />
              <TextField
                required
                type="number"
                label="Maximum Score"
                value={form.max_score ?? ''}
                onChange={(e) => onFieldChange('max_score', e.target.value === '' ? undefined : Number(e.target.value))}
                fullWidth
                inputProps={{ 'data-test-id': 'field-max-score' }}
              />
            </Box>

            <TextField
              required
              type="number"
              label="Threshold"
              value={form.threshold ?? ''}
              onChange={(e) => onFieldChange('threshold', e.target.value === '' ? undefined : Number(e.target.value))}
              helperText="Minimum score required to pass"
              fullWidth
              sx={{ mb: 3 }}
              inputProps={{ 'data-test-id': 'field-threshold' }}
            />
          </>
        )}

        <TextField
          fullWidth
          required
          multiline
          rows={3}
          label="Result Explanation"
          value={form.explanation}
          onChange={(e) => onFieldChange('explanation', e.target.value)}
          helperText="Explain how to articulate the reasoning behind the score."
          inputProps={{ 'data-test-id': 'field-explanation' }}
        />
      </Box>
    </Paper>
  );
}