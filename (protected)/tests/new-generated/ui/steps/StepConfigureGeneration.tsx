'use client';

import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  FormHelperText,
  Autocomplete,
  Skeleton,
  Typography,
} from '@mui/material';
import BaseTag from '@/components/common/BaseTag';
import type { UiConfigureGenerationProps } from '../types';

export function StepConfigureGeneration({
  projects,
  behaviors,
  isLoading,
  error,
  configData,
  onConfigChange,
  onSubmit,
}: UiConfigureGenerationProps) {
  const update = <K extends keyof typeof configData>(k: K, v: (typeof configData)[K]) =>
    onConfigChange({ ...configData, [k]: v });

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Skeleton variant="rectangular" height={56} sx={{ mb: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const selectedProject =
    projects.find((p) => p.name === configData.project_name) ?? null;

  return (
    <Box component="form" id="generation-config-form" onSubmit={(e) => { e.preventDefault(); onSubmit(configData); }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            id="project-select"
            options={projects}
            value={selectedProject}
            onChange={(_, value) => update('project_name', value?.name ?? '')}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => (
              <TextField
                {...params}
                id="project-input"
                name="project"
                label="Select Project"
                required
                sx={{ mb: 3 }}
                data-test-id="project-input"
              />
            )}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="behaviors-label" required>
              Behaviors
            </InputLabel>
            <Select
              labelId="behaviors-label"
              id="behaviors-select"
              name="behaviors"
              multiple
              value={configData.behaviors}
              onChange={(e) => update('behaviors', e.target.value as string[])}
              input={<OutlinedInput label="Behaviors" />}
              renderValue={(selected) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Stack>
              )}
              data-test-id="behaviors-select"
            >
              {behaviors.map((b) => (
                <MenuItem key={b.id} value={b.name}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select at least one behavior</FormHelperText>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="purposes-label" required>
              Purpose
            </InputLabel>
            <Select
              labelId="purposes-label"
              id="purposes-select"
              name="purposes"
              multiple
              value={configData.purposes}
              onChange={(e) => update('purposes', e.target.value as string[])}
              input={<OutlinedInput label="Purpose" />}
              renderValue={(selected) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Stack>
              )}
              data-test-id="purposes-select"
            >
              {['Regression Testing', 'New Feature Testing', 'Integration Testing', 'Edge Case Testing', 'Performance Testing'].map(
                (purpose) => (
                  <MenuItem key={purpose} value={purpose}>
                    {purpose}
                  </MenuItem>
                ),
              )}
            </Select>
            <FormHelperText>Select at least one purpose</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="test-type-select"
            name="testType"
            select
            fullWidth
            label="Test Type"
            value={configData.test_type}
            onChange={(e) => update('test_type', e.target.value as typeof configData.test_type)}
            sx={{ mb: 3 }}
            data-test-id="test-type-select"
          >
            <MenuItem value="single_turn">Single Turn</MenuItem>
          </TextField>

          <TextField
            id="response-generation-select"
            name="response_generation"
            select
            fullWidth
            label="Response Generation"
            value={configData.response_generation}
            onChange={(e) => update('response_generation', e.target.value as typeof configData.response_generation)}
            sx={{ mb: 3 }}
            data-test-id="response-generation-select"
          >
            <MenuItem value="prompt_only">Generate Prompts Only</MenuItem>
            <MenuItem value="prompt_and_response">Generate Prompts with Expected Responses</MenuItem>
          </TextField>

          <TextField
            id="test-coverage-select"
            name="test_coverage"
            select
            fullWidth
            label="Test Coverage"
            value={configData.test_coverage}
            onChange={(e) => update('test_coverage', e.target.value as typeof configData.test_coverage)}
            sx={{ mb: 3 }}
            data-test-id="test-coverage-select"
          >
            <MenuItem value="focused">Focused Coverage (100 test cases)</MenuItem>
            <MenuItem value="standard">Standard Coverage (1,000 test cases)</MenuItem>
            <MenuItem value="comprehensive">Comprehensive Coverage (5,000 test cases)</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <BaseTag
            id="topics-tags"
            name="topics"
            value={configData.tags}
            onChange={(value) => update('tags', value)}
            placeholder="Add topics..."
            label="Topics to cover"
            sx={{ mb: 3 }}
            data-test-id="topics-tags"
          />

          <TextField
            id="description-input"
            name="description"
            fullWidth
            multiline
            rows={4}
            label="Describe what you want to test"
            value={configData.description}
            onChange={(e) => update('description', e.target.value)}
            required
            data-test-id="description-input"
          />
        </Grid>
      </Grid>
    </Box>
  );
}