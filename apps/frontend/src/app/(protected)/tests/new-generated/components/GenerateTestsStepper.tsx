'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Container,
  Grid,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  OutlinedInput,
  FormHelperText,
  Paper,
  Rating,
  Alert,
  AlertTitle,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import BaseTag from '@/components/common/BaseTag';
import StarIcon from '@mui/icons-material/StarOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotifications } from '@/components/common/NotificationContext';

export interface ProcessedDocument {
  id: string;
  name: string;
  description: string;
  path: string;
  content: string;
  originalName: string;
  status: 'uploading' | 'extracting' | 'generating' | 'completed' | 'error';
}

import {
  readProjectsProjectsGetOptions,
  readBehaviorsBehaviorsGetOptions,
  uploadDocumentServicesDocumentsUploadPostMutation,
  extractDocumentContentServicesDocumentsExtractPostMutation,
  generateTextServicesGenerateTextPostMutation,
  generateTestSetTestSetsGeneratePostMutation,
    generateTestsEndpointServicesGenerateTestsPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  GenerateTestsPrompt,
    GenerationSample,
  ProjectDetail,
  RhesisBackendAppUtilsSchemaFactoryBehaviorDetail1,
  TestSetGenerationConfig
} from '@/api-client';

interface GenerateTestsStepperProps {
}

// ---------- Constants ----------

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const PURPOSES = [
  'Regression Testing',
  'New Feature Testing',
  'Integration Testing',
  'Edge Case Testing',
  'Performance Testing',
];

const INITIAL_CONFIG: TestSetGenerationConfig = {
  project_name: null,
  behaviors: [],
  purposes: [],
  test_type: 'single_turn',
  response_generation: 'prompt_only',
  test_coverage: 'focused',
  tags: [],
  description: '',
};

const SUPPORTED_FILE_EXTENSIONS = [
  '.docx',
  '.pptx',
  '.xlsx',
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.zip',
  '.epub',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ---------- Helpers ----------

const getLabelText = (value: number) =>
    `${value} Star${value !== 1 ? 's' : ''}, ${RATING_LABELS[value]}`;

const generatePromptFromConfig = (config: TestSetGenerationConfig): GenerateTestsPrompt => ({
  project_context: config.project_name || 'General',
  test_behaviors: config.behaviors,
  test_purposes: config.purposes,
  key_topics: config.tags,
  specific_requirements: config.description,
  test_type:
      config.test_type === 'single_turn'
          ? 'Single interaction tests'
          : 'Multi-turn conversation tests',
  output_format:
      config.response_generation === 'prompt_only'
          ? 'Generate only user inputs'
          : 'Generate both user inputs and expected responses',
});

// ---------- Step 1: ConfigureGeneration ----------

const ConfigureGeneration = ({
                               onSubmit,
                               configData,
                               onConfigChange,
                             }: {
  onSubmit: (config: TestSetGenerationConfig) => void;
  configData: TestSetGenerationConfig;
  onConfigChange: (config: TestSetGenerationConfig) => void;
}) => {
  const { show } = useNotifications();

  const projectsQuery = useQuery(
      readProjectsProjectsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }),
  );
  const behaviorsQuery = useQuery(
      readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }),
  );

  // normalize to non-null strings
  const projects: Omit<ProjectDetail, 'nano_id'>[] = (projectsQuery.data?.data ?? [])
      .map((p) => ({ id: String(p.id ?? ''), name: String(p.name ?? '').trim() }))
      .filter((p) => p.id && p.name);

  const behaviors: Omit<RhesisBackendAppUtilsSchemaFactoryBehaviorDetail1, 'nano_id'>[] = (behaviorsQuery.data?.data ?? [])
      .map((b) => ({ id: String(b.id ?? ''), name: String(b.name ?? '').trim() }))
      .filter((b) => b.id && b.name);

  const isLoading = projectsQuery.isLoading || behaviorsQuery.isLoading;

  useEffect(() => {
    if (projectsQuery.error) {
      show((projectsQuery.error as Error).message || 'Failed to load projects', { severity: 'error' });
    }
  }, [projectsQuery.error, show]);

  useEffect(() => {
    if (behaviorsQuery.error) {
      show((behaviorsQuery.error as Error).message || 'Failed to load behaviors', { severity: 'error' });
    }
  }, [behaviorsQuery.error, show]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!configData.project_name) newErrors.project = 'Project is required';
    if (!configData.behaviors || configData.behaviors.length === 0) newErrors.behaviors = 'Select at least one behavior';
    if (!configData.purposes || configData.purposes.length === 0) newErrors.purposes = 'Select at least one purpose';
    if (!configData.description || !configData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [configData]);

  const updateField = useCallback(
      <K extends keyof TestSetGenerationConfig>(field: K, value: TestSetGenerationConfig[K]) => {
        onConfigChange({ ...configData, [field]: value });
        if (errors[field as string]) setErrors((prev) => ({ ...prev, [field as string]: '' }));
      },
      [configData, errors, onConfigChange],
  );

  const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) onSubmit(configData);
      },
      [configData, validateForm, onSubmit],
  );
    const selectedProject = useMemo<Omit<ProjectDetail, 'nano_id'> | null>(() => {
        if (!configData.project_name) return null;
        return projects.find((p) => p.name === configData.project_name) ?? null;
    }, [projects, configData.project_name]);

  if (isLoading) {
    return (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Skeleton variant="rectangular" height={56} sx={{ mb: 3 }} />
              </Grid>
          ))}
        </Grid>
    );
  }

  return (
      <form id="generation-config-form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
                id="project-select"
                options={projects}
                value={selectedProject}
                onChange={(_, value) => updateField('project_name', value?.name ?? '')}
                getOptionLabel={(option) => option.name??''}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderOption={(props, option) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { key, ...otherProps } = props;
                  return (
                      <Box component="li" key={option.id} {...otherProps}>
                        {option.name}
                      </Box>
                  );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        id="project-input"
                        name="project"
                        label="Select Project"
                        required
                        error={!!errors.project}
                        helperText={errors.project}
                        sx={{ mb: 3 }}
                    />
                )}
            />

            <FormControl fullWidth error={!!errors.behaviors} sx={{ mb: 3 }}>
              <InputLabel id="behaviors-label" required>
                Behaviors
              </InputLabel>
              <Select
                  labelId="behaviors-label"
                  id="behaviors-select"
                  name="behaviors"
                  multiple
                  value={configData.behaviors}
                  onChange={(e) => updateField('behaviors', e.target.value as string[])}
                  input={<OutlinedInput label="Behaviors" />}
                  renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                        ))}
                      </Stack>
                  )}
              >
                {behaviors.map((behavior) => (
                    <MenuItem key={behavior.id} value={behavior.name??undefined}>
                      {behavior.name}
                    </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.behaviors}</FormHelperText>
            </FormControl>

            <FormControl fullWidth error={!!errors.purposes} sx={{ mb: 3 }}>
              <InputLabel id="purposes-label" required>
                Purpose
              </InputLabel>
              <Select
                  labelId="purposes-label"
                  id="purposes-select"
                  name="purposes"
                  multiple
                  value={configData.purposes}
                  onChange={(e) => updateField('purposes', e.target.value as string[])}
                  input={<OutlinedInput label="Purpose" />}
                  renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                        ))}
                      </Stack>
                  )}
              >
                {PURPOSES.map((purpose) => (
                    <MenuItem key={purpose} value={purpose}>
                      {purpose}
                    </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.purposes}</FormHelperText>
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
                onChange={(e) => updateField('test_type', e.target.value as TestSetGenerationConfig['test_type'])}
                sx={{ mb: 3 }}
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
                onChange={(e) =>
                    updateField('response_generation', e.target.value as TestSetGenerationConfig['response_generation'])
                }
                sx={{ mb: 3 }}
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
                onChange={(e) => updateField('test_coverage', e.target.value as TestSetGenerationConfig['test_coverage'])}
                sx={{ mb: 3 }}
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
                value={configData.tags??[]}
                onChange={(value) => updateField('tags', value)}
                placeholder="Add topics..."
                label="Topics to cover"
                error={!!errors.tags}
                helperText={errors.tags}
                sx={{ mb: 3 }}
            />

            <TextField
                id="description-input"
                name="description"
                fullWidth
                multiline
                rows={4}
                label="Describe what you want to test"
                value={configData.description}
                onChange={(e) => updateField('description', e.target.value)}
                required
                error={!!errors.description}
                helperText={errors.description}
            />
          </Grid>
        </Grid>
      </form>
  );
};

// ---------- Step 2: UploadDocuments (mutations only) ----------

const UploadDocuments = ({
                           documents,
                           onDocumentsChange,
                         }: {
  documents: ProcessedDocument[];
  onDocumentsChange: (
      documents: ProcessedDocument[] | ((prev: ProcessedDocument[]) => ProcessedDocument[])
  ) => void;
}) => {
  const { show } = useNotifications();

  const uploadMutation = useMutation({
    ...uploadDocumentServicesDocumentsUploadPostMutation(),
  });
  const extractMutation = useMutation({
    ...extractDocumentContentServicesDocumentsExtractPostMutation(),
  });
  const genTextForMetadata = useMutation({
    ...generateTextServicesGenerateTextPostMutation(),
  });

  const filenameBase = (name: string) => name.replace(/\.[^/.]+$/, '');

  const parseLLMMetadata = (output: string, fallbackName: string, fallbackDesc: string) => {
    try {
      const parsed = JSON.parse(output) as { name?: string; description?: string };
      return {
        name: (parsed.name ?? '').trim() || fallbackName,
        description: (parsed.description ?? '').trim() || fallbackDesc,
      };
    } catch {
      return { name: fallbackName, description: fallbackDesc };
    }
  };

  const processDocument = useCallback(
      async (file: File) => {
        const documentId = Math.random().toString(36).slice(2, 11);

        const initialDoc: ProcessedDocument = {
            id: documentId,
            name: '',
            description: '',
            path: '',
            content: '',
            originalName: '',
            status: 'uploading'
        };
        onDocumentsChange((prev) => [...prev, initialDoc]);

        try {

          const uploadRes = await uploadMutation.mutateAsync({ body: { document: file } });
          const uploadPath = (uploadRes).path;
          onDocumentsChange((prev) =>
              prev.map((d) => (d.id === documentId ? { ...d, path: uploadPath, status: 'extracting' } : d)),
          );

          const extractRes = await extractMutation.mutateAsync({ body: { path: uploadPath } });
          const extracted = (extractRes).content;

          onDocumentsChange((prev) =>
              prev.map((d) => (d.id === documentId ? { ...d, content: extracted, status: 'generating' } : d)),
          );

          const fallbackName = filenameBase(file.name);
          const fallbackDesc = extracted?.slice(0, 160) || '';

          const metaRes = await genTextForMetadata.mutateAsync({
            body: {
                prompt:
                    'Given the following document content, produce a short JSON object with "name" and "description". Output ONLY JSON.\n\n' +
                    '---\n' +
                    extracted +
                    '\n---',
                stream: false,
            },
          });

          const outputText = metaRes.text ?? '';
          const { name, description } = parseLLMMetadata(outputText, fallbackName, fallbackDesc);

          onDocumentsChange((prev) =>
              prev.map((d) =>
                  d.id === documentId ? { ...d, name, description, status: 'completed' } : d,
              ),
          );

          show(`Document "${file.name}" processed successfully`, { severity: 'success' });
        } catch {
          onDocumentsChange((prev) =>
              prev.map((d) => (d.id === documentId ? { ...d, status: 'error' } : d)),
          );
          show(`Failed to process document "${file.name}"`, { severity: 'error' });
        }
      },
      [uploadMutation, extractMutation, genTextForMetadata, onDocumentsChange, show],
  );

  const handleFileUpload = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files?.length) return;

        for (const file of Array.from(files)) {
          if (file.size > MAX_FILE_SIZE) {
            show(`File "${file.name}" is too large. Maximum size is 5 MB.`, { severity: 'error' });
            continue;
          }
          await processDocument(file);
        }
        event.target.value = '';
      },
      [processDocument, show],
  );

  const handleDocumentUpdate = useCallback(
      (id: string, field: 'name' | 'description', value: string) => {
        onDocumentsChange((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
      },
      [onDocumentsChange],
  );

  const handleRemoveDocument = useCallback(
      (id: string) => {
        onDocumentsChange((prev) => prev.filter((d) => d.id !== id));
      },
      [onDocumentsChange],
  );

  const canProceed = documents.length === 0 || documents.every((doc) => doc.status === 'completed');

  return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Upload Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select documents to add context to test generation (optional).
        </Typography>

        <Box sx={{ mb: 3 }}>
          <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="document-upload"
              accept={SUPPORTED_FILE_EXTENSIONS.join(',')}
          />
          <label htmlFor="document-upload">
            <LoadingButton component="span" variant="contained" startIcon={<UploadFileIcon />} disabled={!canProceed}>
              Select Documents
            </LoadingButton>
          </label>
          <FormHelperText>
            Supported formats: {SUPPORTED_FILE_EXTENSIONS.join(', ')} • Maximum file size: 5 MB
          </FormHelperText>
        </Box>

        {documents.length > 0 && (
            <Stack spacing={2} sx={{ mb: 3 }}>
              {documents.map((doc) => (
                  <Paper key={doc.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="subtitle1">{doc.originalName}</Typography>
                          <Chip
                              label={doc.status}
                              color={doc.status === 'completed' ? 'success' : doc.status === 'error' ? 'error' : 'info'}
                              size="small"
                          />
                          {doc.status !== 'uploading' && (
                              <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleRemoveDocument(doc.id)}>
                                Remove
                              </Button>
                          )}
                        </Box>

                        {doc.status === 'completed' && (
                            <>
                              <TextField
                                  fullWidth
                                  label="Name"
                                  value={doc.name}
                                  onChange={(e) => handleDocumentUpdate(doc.id, 'name', e.target.value)}
                                  sx={{ mb: 2 }}
                                  size="small"
                              />
                              <TextField
                                  fullWidth
                                  multiline
                                  rows={2}
                                  label="Description"
                                  value={doc.description}
                                  onChange={(e) => handleDocumentUpdate(doc.id, 'description', e.target.value)}
                                  size="small"
                              />
                            </>
                        )}

                        {doc.status !== 'completed' && doc.status !== 'error' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                {doc.status === 'uploading' && 'Uploading...'}
                                {doc.status === 'extracting' && 'Extracting content...'}
                                {doc.status === 'generating' && 'Generating metadata...'}
                              </Typography>
                            </Box>
                        )}

                        {doc.status === 'error' && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              Failed to process this document. Please try uploading again.
                            </Alert>
                        )}
                      </Box>
                    </Box>
                  </Paper>
              ))}
            </Stack>
        )}
      </Box>
  );
};

// ---------- Step 3: ReviewSamples (uses text generation mutation) ----------

const ReviewSamples = ({
                         samples,
                         onSamplesChange,
                         configData,
                         documents,
                         isLoading = false,
                       }: {
  samples: GenerationSample[];
  onSamplesChange: (samples: GenerationSample[]) => void;
  configData: TestSetGenerationConfig;
  documents: ProcessedDocument[];
  isLoading?: boolean;
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [regenerating, setRegenerating] = useState<Set<number>>(new Set());
  const { show } = useNotifications();

  const generateTestsMutation = useMutation({
    ...generateTestsEndpointServicesGenerateTestsPostMutation(),
  });

  const updateSample = useCallback(
      (id: number, updates: Partial<GenerationSample>) => {
        onSamplesChange(samples.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      },
      [samples, onSamplesChange],
  );

  const handleRatingChange = useCallback(
      (id: number, rating: number | null) => {
        updateSample(id, {
          rating,
          feedback: rating && rating >= 4 ? '' : samples.find((s) => s.id === id)?.feedback ?? '',
        });
      },
      [updateSample, samples],
  );

  const handleFeedbackChange = useCallback(
      (id: number, feedback: string) => {
        updateSample(id, { feedback });
      },
      [updateSample],
  );

  const loadMoreSamples = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const documentPayload = documents
          .filter((d) => d.status === 'completed')
          .map((d) => ({ name: d.name, description: d.description, content: d.content }));
console.log('fine me', {
    prompt: generatePromptFromConfig(configData),
    num_tests: 5,
    documents: documentPayload,
})

      const res = await generateTestsMutation.mutateAsync({
        body: {
          prompt: generatePromptFromConfig(configData),
          num_tests: 5,
          documents: documentPayload,
        },
      });

      const tests = res.tests ?? [];

      if (tests.length) {
        const start = Math.max(0, ...samples.map((s) => s.id)) + 1;
        const newSamples: GenerationSample[] = tests.map((t, i) => ({
          id: start + i,
          text: t.prompt.content,
          behavior: t.behavior,
          topic: t.topic,
          rating: null,
          feedback: '',
        }));
        onSamplesChange([...samples, ...newSamples]);
        show('Additional samples loaded', { severity: 'success' });
      }
    } catch {
      show('Failed to load more samples', { severity: 'error' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [documents, configData, generateTestsMutation, samples, onSamplesChange, show]);

  const regenerateSample = useCallback(
      async (sampleId: number) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (!sample || !sample.feedback || !sample.rating|| sample.rating >= 4) return;

        setRegenerating((prev) => new Set(prev).add(sampleId));
        try {
          const res = await generateTestsMutation.mutateAsync({
            body: {
              prompt: {
                original_test: sample.text,
                test_type: sample.behavior as ("Single interaction tests" | "Multi-turn conversation tests"),
                topic: sample.topic,
                user_rating: `${sample.rating}/5 stars`,
                improvement_feedback: sample.feedback,
                instruction: 'Please generate a new version that addresses the feedback.',
              },
              num_tests: 1,
            },
          });

          const tests = res.tests ?? [];

          if (tests[0]) {
            const t = tests[0];
            updateSample(sampleId, {
              text: t.prompt.content,
              behavior: t.behavior,
              topic: t.topic,
              rating: null,
              feedback: '',
            });
            show('Test regenerated successfully', { severity: 'success' });
          }
        } catch {
          show('Failed to regenerate test', { severity: 'error' });
        } finally {
          setRegenerating((prev) => {
            const next = new Set(prev);
            next.delete(sampleId);
            return next;
          });
        }
      },
      [samples, generateTestsMutation, updateSample, show],
  );

  if (isLoading) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
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
      <Box>
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
                <Box
                    sx={{ display: 'flex', gap: 1, mb: 1.5, pb: 1, borderBottom: 1, borderColor: 'divider' }}
                >
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
                          onChange={(e) => handleFeedbackChange(sample.id, e.target.value)}
                          variant="standard"
                          size="small"
                          disabled={!sample.rating || sample.rating >= 4}
                          sx={{ flex: 1 }}
                      />

                      <LoadingButton
                          loading={regenerating.has(sample.id)}
                          onClick={() => regenerateSample(sample.id)}
                          variant="outlined"
                          size="small"
                          startIcon={<AutorenewIcon />}
                          disabled={!sample.feedback || !sample.rating || sample.rating >= 4}
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
                        onChange={(_, value) => handleRatingChange(sample.id, value)}
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
              onClick={loadMoreSamples}
              loading={isLoadingMore}
              startIcon={<AutoFixHighIcon />}
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
          >
            Load More Samples
          </LoadingButton>
        </Stack>
      </Box>
  );
};

// ---------- Step 4: ConfirmGenerate (no Behavior type dependency) ----------

const ConfirmGenerate = ({
                           samples,
                           configData,
                           documents,
                         }: {
  samples: GenerationSample[];
  configData: TestSetGenerationConfig;
  documents: ProcessedDocument[];
}) => {
  const rated = samples.filter((s) => s.rating !== null);
  const avg =
      rated.length > 0
          ? (rated.reduce((acc, s) => acc + (s.rating ?? 0), 0) / rated.length).toFixed(1)
          : 'N/A';

  return (
      <Box>
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
                {configData.behaviors?.map((name) => (
                    <Chip key={name} label={name} size="small" />
                ))}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Topics
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {configData.tags?.map((tag) => (
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
                <Rating
                    value={Number.isNaN(Number(avg)) ? 0 : Number(avg)}
                    precision={0.1}
                    readOnly
                    size="small"
                />
                <Typography variant="body2">({avg})</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Alert severity="info">
          <AlertTitle>What happens next?</AlertTitle>
          When you click &quot;Generate Tests&quot;, we&apos;ll create your test suite and notify you when
          ready.
        </Alert>
      </Box>
  );
};

// ---------- Main Stepper ----------

export default function GenerateTestsStepper({ }: GenerateTestsStepperProps) {
  const router = useRouter();
  const { show } = useNotifications();

  const [activeStep, setActiveStep] = useState(0);
  const [configData, setConfigData] = useState<TestSetGenerationConfig>(INITIAL_CONFIG);
  const [samples, setSamples] = useState<GenerationSample[]>([]);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const generateTestsMutation = useMutation({
    ...generateTestsEndpointServicesGenerateTestsPostMutation(),
  });

  const generateTestSetMutation = useMutation({
    ...generateTestSetTestSetsGeneratePostMutation(),
  });

  const steps = ['Configure Generation', 'Upload Documents', 'Review Samples', 'Confirm & Generate'];

  const handleConfigSubmit = useCallback((config: TestSetGenerationConfig) => {
    setConfigData(config);
    setActiveStep(1);
  }, []);

  const handleConfigChange = useCallback((config: TestSetGenerationConfig) => {
    setConfigData(config);
  }, []);

  const handleDocumentsSubmit = useCallback(async () => {
    setActiveStep(2);
    setIsGenerating(true);
    try {
      const generatedPrompt = generatePromptFromConfig(configData);
      const documentPayload = documents
          .filter((d) => d.status === 'completed')
          .map((d) => ({ name: d.name, description: d.description, content: d.content }));
console.log('find me',  { prompt: generatedPrompt, num_tests: 5, documents: documentPayload })
      const res = await generateTestsMutation.mutateAsync({
        body: { prompt: generatedPrompt, num_tests: 5, documents: documentPayload },
      });

      const tests = res.tests ?? [];

      if (!tests.length) {
        show('No tests generated in response. Please try again.', { severity: 'error' });
        return;
      }

      const newSamples: GenerationSample[] = tests.map((t, i) => ({
        id: i + 1,
        text: t.prompt.content,
        behavior: t.behavior,
        topic: t.topic,
        rating: null,
        feedback: '',
      }));

      setSamples(newSamples);
      show('Samples generated successfully', { severity: 'success' });
    } catch {
      show('Failed to generate samples', { severity: 'error' });
      setActiveStep(1);
    } finally {
      setIsGenerating(false);
    }
  }, [configData, documents, generateTestsMutation, show]);

  const handleNext = useCallback(() => {
    if (activeStep === 1) {
      const hasProcessing = documents.some((d) => d.status !== 'completed' && d.status !== 'error');
      if (hasProcessing) {
        show('Please wait for all documents to finish processing', { severity: 'warning' });
        return;
      }
      void handleDocumentsSubmit();
      return;
    }

    if (activeStep === 2) {
      const hasUnrated = samples.some((s) => s.rating === null);
      if (hasUnrated) {
        show('Please rate all samples before proceeding', { severity: 'error' });
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  }, [activeStep, documents, samples, show, handleDocumentsSubmit]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  const handleFinish = useCallback(async () => {
    setIsFinishing(true);
    try {
      // Convert UI data to API format
      const generationConfig: TestSetGenerationConfig = {
        project_name: configData.project_name,
        behaviors: configData.behaviors,
        purposes: configData.purposes,
        test_type: configData.test_type,
        response_generation: configData.response_generation,
        test_coverage: configData.test_coverage,
        tags: configData.tags,
        description: configData.description,
      };

      const generationSamples = samples.map((s) => ({
        id: s.id,
        text: s.text,
        behavior: s.behavior,
        topic: s.topic,
        rating: s.rating,
        feedback: s.feedback,
      }));

      const res = await generateTestSetMutation.mutateAsync({
        body: {
          config: generationConfig,
          samples: generationSamples,
          synthesizer_type: 'prompt',
          batch_size: 20,
        },
      });
console.log(res);
      const message = res.message ?? 'Generation started';
      show(message, { severity: 'success' });
      setTimeout(() => router.push('/tests'), 2000);
    } catch {
      show('Failed to start test generation. Please try again.', { severity: 'error' });
    } finally {
      setIsFinishing(false);
    }
  }, [configData, samples, generateTestSetMutation, router, show]);

  const renderStepContent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
            <ConfigureGeneration
                onSubmit={handleConfigSubmit}
                configData={configData}
                onConfigChange={handleConfigChange}
            />
        );
      case 1:
        return <UploadDocuments documents={documents} onDocumentsChange={setDocuments} />;
      case 2:
        return (
            <ReviewSamples
                samples={samples}
                onSamplesChange={setSamples}
                configData={configData}
                documents={documents}
                isLoading={isGenerating}
            />
        );
      case 3:
        return (
            <ConfirmGenerate
                samples={samples}
                configData={configData}
                documents={documents}
            />
        );
      default:
        return null;
    }
  }, [activeStep, handleConfigSubmit, configData, handleConfigChange, documents, samples, isGenerating]);

  return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
          <Stepper activeStep={activeStep} sx={{ py: 4 }}>
            {steps.map(
                (label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                ),
            )}
          </Stepper>

          <Box sx={{ flex: 1, mt: 4 }}>{renderStepContent}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            {activeStep > 0 && (
                <Button variant="outlined" onClick={handleBack} disabled={isGenerating}>
                  Back
                </Button>
            )}

            {activeStep === 3 ? (
                <LoadingButton variant="contained" onClick={handleFinish} loading={isFinishing} disabled={isFinishing}>
                  Generate Tests
                </LoadingButton>
            ) : (
                <Button
                    variant="contained"
                    type={activeStep === 0 ? 'submit' : 'button'}
                    form={activeStep === 0 ? 'generation-config-form' : undefined}
                    onClick={activeStep === 0 ? undefined : handleNext}
                    disabled={
                        isGenerating ||
                        (activeStep === 1 &&
                            documents.some((d) => d.status !== 'completed' && d.status !== 'error'))
                    }
                >
                  Next
                </Button>
            )}
          </Box>
        </Box>
      </Container>
  );
}
