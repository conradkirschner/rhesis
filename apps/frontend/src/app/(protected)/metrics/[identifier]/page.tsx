'use client';

import React, {useRef, useState} from 'react';
import {useTheme} from '@mui/material/styles';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BaseTag from '@/components/common/BaseTag';
import {PageContainer} from '@toolpad/core/PageContainer';
import {useParams} from 'next/navigation';
import {useMutation, useQuery} from '@tanstack/react-query';

import {
  readMetricMetricsMetricIdGetOptions,
  readModelsModelsGetOptions,
  readStatusesStatusesGetOptions,
  readUsersUsersGetOptions,
  updateMetricMetricsMetricIdPutMutation,
} from '@/api-client/@tanstack/react-query.gen';
import {Metric, Model, ScoreType,} from '@/api-client/types.gen';
import {useNotifications} from '@/components/common/NotificationContext';

type EditableSectionType = 'general' | 'evaluation' | 'configuration';

interface EditData {
  name?: string;
  description?: string;
  model_id?: string;
  evaluation_prompt?: string;
  evaluation_steps?: string[];
  reasoning?: string;
  score_type?: ScoreType;
  min_score?: number;
  max_score?: number;
  threshold?: number;
  explanation?: string;
}

interface StepWithId {
  id: string;
  content: string;
}

export default function MetricDetailPage() {
  const params = useParams<{ identifier: string }>();
  const identifier = params.identifier;
  const theme = useTheme();
  const notifications = useNotifications();

  // --------- Queries ----------
  const metricQuery = useQuery(
      readMetricMetricsMetricIdGetOptions({
        path: { metric_id: identifier },
      }),
  );

  const statusesQuery = useQuery(
      readStatusesStatusesGetOptions({
        query: { entity_type: 'Metric', sort_by: 'name', sort_order: 'asc' },
      }),
  );

  const usersQuery = useQuery(
      readUsersUsersGetOptions({
        query: { limit: 100, skip: 0 },
      }),
  );

  const modelsQuery = useQuery(
      readModelsModelsGetOptions({
        query: { limit: 100, skip: 0 },
      }),
  );

  const metric = metricQuery.data as Metric | undefined;
  const models = (modelsQuery.data?.data ?? []) as Model[];
  // const statuses = (statusesQuery.data ?? []) as Status[];
  // const users = (usersQuery.data?.data ?? []) as User[];

  const loading =
      metricQuery.isLoading ||
      statusesQuery.isLoading ||
      usersQuery.isLoading;

  const [isEditing, setIsEditing] = useState<EditableSectionType | null>(null);
  const [editData, setEditData] = useState<Partial<EditData>>({});
  const [stepsWithIds, setStepsWithIds] = useState<StepWithId[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for uncontrolled text fields
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const evaluationPromptRef = useRef<HTMLTextAreaElement>(null);
  const reasoningRef = useRef<HTMLTextAreaElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const stepRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // --------- Mutation ----------
  const updateMetricMutation = useMutation(
      updateMetricMetricsMetricIdPutMutation(),
  );

  // --------- Helpers ----------
  const collectFieldValues = React.useCallback((): Partial<EditData> => {
    const values: Partial<EditData> = {};

    if (nameRef.current) values.name = nameRef.current.value;
    if (descriptionRef.current) values.description = descriptionRef.current.value;
    if (evaluationPromptRef.current) values.evaluation_prompt = evaluationPromptRef.current.value;
    if (reasoningRef.current) values.reasoning = reasoningRef.current.value;
    if (explanationRef.current) values.explanation = explanationRef.current.value;

    const stepValues: string[] = [];
    stepsWithIds.forEach(step => {
      const stepElement = stepRefs.current.get(step.id);
      if (stepElement) stepValues.push(stepElement.value);
    });
    if (stepValues.length > 0) values.evaluation_steps = stepValues;

    return values;
  }, [stepsWithIds]);

  const populateFieldRefs = React.useCallback(
      (section: EditableSectionType, currentMetric: Metric) => {
        if (section === 'general') {
          if (nameRef.current) nameRef.current.value = currentMetric.name ?? '';
          if (descriptionRef.current)
            descriptionRef.current.value = currentMetric.description ?? '';
        } else if (section === 'evaluation') {
          if (evaluationPromptRef.current)
            evaluationPromptRef.current.value = currentMetric.evaluation_prompt ?? '';
          if (reasoningRef.current)
            reasoningRef.current.value = currentMetric.reasoning ?? '';

          const steps =
              currentMetric.evaluation_steps?.split('\n---\n') ?? [''];
          const list = steps.map((step, index) => {
            const cleanedStep = step.replace(/^Step \d+:\n?/, '').trim();
            return { id: `step-${Date.now()}-${index}`, content: cleanedStep };
          });
          setStepsWithIds(list);

          // Fill refs after render
          setTimeout(() => {
            list.forEach(step => {
              const el = stepRefs.current.get(step.id);
              if (el) el.value = step.content;
            });
          }, 0);
        } else if (section === 'configuration') {
          if (explanationRef.current)
            explanationRef.current.value = currentMetric.explanation ?? '';
        }
      },
      [],
  );

  const handleTagsChange = React.useCallback(
      async () => {
        try {
          await metricQuery.refetch();
        } catch {
          notifications.show('Failed to refresh metric data', { severity: 'error' });
        }
      },
      [metricQuery, notifications],
  );

  const handleEdit = React.useCallback(
      (section: EditableSectionType) => {
        if (!metric) return;
        setIsEditing(section);
        populateFieldRefs(section, metric);

        if (section === 'evaluation') {
          setEditData({
            model_id: metric.model_id ?? undefined,
          });
        } else if (section === 'configuration') {
          setEditData({
            score_type: (metric.score_type ?? 'binary') as ScoreType,
            min_score: metric.min_score ?? undefined,
            max_score: metric.max_score ?? undefined,
            threshold: metric.threshold ?? undefined,
          });
        } else {
          setEditData({});
        }
      },
      [metric, populateFieldRefs],
  );

  const handleCancelEdit = React.useCallback(() => {
    setIsEditing(null);
    setEditData({});
    setStepsWithIds([]);
    stepRefs.current.clear();
  }, []);

  const handleConfirmEdit = React.useCallback(async () => {
    if (!metric) return;

    setIsSaving(true);
    try {
      const fieldValues = collectFieldValues();

      const payload: Record<string, string | number | string[] | ScoreType> = {};

      if (typeof fieldValues.name === 'string') payload.name = fieldValues.name;
      if (typeof fieldValues.description === 'string') payload.description = fieldValues.description;
      if (typeof fieldValues.evaluation_prompt === 'string') payload.evaluation_prompt = fieldValues.evaluation_prompt;
      if (typeof fieldValues.reasoning === 'string') payload.reasoning = fieldValues.reasoning;
      if (typeof fieldValues.explanation === 'string') payload.explanation = fieldValues.explanation;
      if (typeof editData.model_id === 'string') payload.model_id = editData.model_id;
      if (editData.score_type) payload.score_type = editData.score_type;
      if (typeof editData.min_score === 'number') payload.min_score = editData.min_score;
      if (typeof editData.max_score === 'number') payload.max_score = editData.max_score;
      if (typeof editData.threshold === 'number') payload.threshold = editData.threshold;

      if (Array.isArray(fieldValues.evaluation_steps)) {
        payload.evaluation_steps = fieldValues.evaluation_steps
            .map((s, i) => `Step ${i + 1}:\n${s}`)
            .join('\n---\n');
      }

      await updateMetricMutation.mutateAsync({
        path: { metric_id: metric.id },
        body: payload,
      });

      await metricQuery.refetch();
      setIsEditing(null);
      setEditData({});
      setStepsWithIds([]);
      notifications.show('Metric updated successfully', { severity: 'success' });
    } catch (err) {
      const msg =
          err instanceof Error ? err.message : 'Failed to update metric';
      notifications.show(msg, { severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [metric, collectFieldValues, editData, updateMetricMutation, metricQuery, notifications]);

  const addStep = React.useCallback(() => {
    setStepsWithIds(prev => [
      ...prev,
      { id: `step-${Date.now()}-${prev.length}`, content: '' },
    ]);
  }, []);

  const removeStep = React.useCallback((stepId: string) => {
    setStepsWithIds(prev => prev.filter(s => s.id !== stepId));
    stepRefs.current.delete(stepId);
  }, []);

  // ------- Presentational helpers -------
  const EditableSection = React.memo(
      ({
         title,
         icon,
         section,
         children,
         isEditingSection,
         onEdit,
         onCancel,
         onConfirm,
         saving,
       }: {
        title: string;
        icon: React.ReactNode;
        section: EditableSectionType;
        children: React.ReactNode;
        isEditingSection: EditableSectionType | null;
        onEdit: (s: EditableSectionType) => void;
        onCancel: () => void;
        onConfirm: () => void;
        saving?: boolean;
      }) => {
        return (
            <Paper
                sx={{
                  p: theme.spacing(3),
                  position: 'relative',
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.shadows[1],
                }}
            >
              <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: theme.spacing(3),
                    pb: theme.spacing(2),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
              >
                <SectionHeader icon={icon} title={title} />
                {!isEditingSection && (
                    <Button
                        startIcon={<EditIcon />}
                        onClick={() => onEdit(section)}
                        variant="outlined"
                        size="small"
                        sx={{
                          color: theme.palette.primary.main,
                          borderColor: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.light,
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                    >
                      Edit Section
                    </Button>
                )}
              </Box>

              {isEditingSection === section ? (
                  <Box>
                    <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: theme.spacing(3),
                          p: theme.spacing(2),
                          bgcolor: theme.palette.action.hover,
                          borderRadius: theme.shape.borderRadius,
                          mb: theme.spacing(3),
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                      {children}
                    </Box>
                    <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: theme.spacing(1),
                          mt: theme.spacing(2),
                        }}
                    >
                      <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={onCancel}
                          disabled={saving}
                          sx={{
                            borderColor: theme.palette.error.main,
                            '&:hover': {
                              backgroundColor: theme.palette.error.light,
                              borderColor: theme.palette.error.main,
                            },
                          }}
                      >
                        Cancel
                      </Button>
                      <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CheckIcon />}
                          onClick={onConfirm}
                          disabled={saving}
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: theme.palette.primary.dark,
                            },
                          }}
                      >
                        {saving ? 'Saving...' : 'Save Section'}
                      </Button>
                    </Box>
                  </Box>
              ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {children}
                  </Box>
              )}
            </Paper>
        );
      },
  );
  EditableSection.displayName = 'EditableSection';

  const SectionHeader = React.memo(
      ({ icon, title }: { icon: React.ReactNode; title: string }) => {
        const th = useTheme();
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: th.spacing(1) }}>
              <Box
                  sx={{
                    color: th.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    '& > svg': { fontSize: th.typography.h6.fontSize },
                  }}
              >
                {icon}
              </Box>
              <Typography
                  variant="h6"
                  sx={{
                    fontWeight: th.typography.fontWeightMedium,
                    color: th.palette.text.primary,
                  }}
              >
                {title}
              </Typography>
            </Box>
        );
      },
  );
  SectionHeader.displayName = 'SectionHeader';

  const InfoRow = React.memo(
      ({ label, children }: { label: string; children: React.ReactNode }) => {
        const th = useTheme();
        return (
            <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: th.spacing(1),
                  py: th.spacing(1),
                }}
            >
              <Typography
                  variant="subtitle2"
                  sx={{
                    color: th.palette.text.secondary,
                    fontWeight: th.typography.fontWeightMedium,
                    letterSpacing: '0.02em',
                  }}
              >
                {label}
              </Typography>
              <Box sx={{ '& .MuiTypography-root': { color: th.palette.text.primary } }}>
                {children}
              </Box>
            </Box>
        );
      },
  );
  InfoRow.displayName = 'InfoRow';

  // icons (memoized)
  const infoIcon = <InfoIcon />;
  const assessmentIcon = <AssessmentIcon />;
  const settingsIcon = <SettingsIcon />;

  if (loading) {
    return (
        <PageContainer title="Loading...">
          <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                gap: 1,
              }}
          >
            <CircularProgress size={20} />
            <Typography>Loading metric details...</Typography>
          </Box>
        </PageContainer>
    );
  }

  if (!metric) {
    return (
        <PageContainer title="Error">
          <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
          >
            <Typography color="error">Failed to load metric details</Typography>
          </Box>
        </PageContainer>
    );
  }

  return (
      <PageContainer
          title={metric.name ?? ''}
          breadcrumbs={[
            { title: 'Metrics', path: '/metrics' },
            { title: metric.name ?? '', path: `/metrics/${identifier}` },
          ]}
      >
        <Stack direction="column" spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              {/* General Information */}
              <EditableSection
                  title="General Information"
                  icon={infoIcon}
                  section="general"
                  isEditingSection={isEditing}
                  onEdit={handleEdit}
                  onCancel={handleCancelEdit}
                  onConfirm={handleConfirmEdit}
                  saving={isSaving}
              >
                <InfoRow label="Name">
                  {isEditing === 'general' ? (
                      <TextField
                          key={`name-field-${metric.id}`}
                          fullWidth
                          required
                          inputRef={nameRef}
                          defaultValue={metric.name ?? ''}
                          placeholder="Enter metric name"
                      />
                  ) : (
                      <Typography>{metric.name}</Typography>
                  )}
                </InfoRow>

                <InfoRow label="Description">
                  {isEditing === 'general' ? (
                      <TextField
                          key={`description-field-${metric.id}`}
                          fullWidth
                          multiline
                          rows={4}
                          inputRef={descriptionRef}
                          defaultValue={metric.description ?? ''}
                          placeholder="Enter metric description"
                      />
                  ) : (
                      <Typography>{metric.description ?? '-'}</Typography>
                  )}
                </InfoRow>

                <InfoRow label="Tags">
                  <BaseTag
                      value={(metric.tags ?? []).map(t => t.name)}
                      onChange={handleTagsChange}
                      placeholder="Add tags..."
                      chipColor="primary"
                      disableEdition={isEditing !== 'general'}
                      entityType={'Metric'}
                      entity={{
                        id: metric.id,
                        organization_id: metric.organization_id ?? undefined,
                        user_id: metric.user_id ?? undefined,
                        // normalize null -> undefined to satisfy TaggableEntity
                        tags: metric.tags ?? undefined,
                      }}
                  />
                </InfoRow>
              </EditableSection>

              {/* Evaluation Process */}
              <EditableSection
                  title="Evaluation Process"
                  icon={assessmentIcon}
                  section="evaluation"
                  isEditingSection={isEditing}
                  onEdit={handleEdit}
                  onCancel={handleCancelEdit}
                  onConfirm={handleConfirmEdit}
                  saving={isSaving}
              >
                <InfoRow label="LLM Judge Model">
                  {isEditing === 'evaluation' ? (
                      <FormControl fullWidth>
                        <InputLabel>Model</InputLabel>
                        <Select
                            value={editData.model_id ?? ''}
                            onChange={e =>
                                setEditData(prev => ({
                                  ...prev,
                                  model_id: e.target.value as string,
                                }))
                            }
                            label="Model"
                        >
                          {models.map(m => (
                              <MenuItem key={m.id} value={m.id}>
                                <Box>
                                  <Typography variant="subtitle2">{m.name}</Typography>
                                  <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                  >
                                    {m.description ?? ''}
                                  </Typography>
                                </Box>
                              </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                  ) : (
                      <>
                        <Typography>
                          {(() => {
                            const model =
                                models.find(m => m.id === metric.model_id) ?? null;
                            return model ? model.name : metric.model_id ?? '-';
                          })()}
                        </Typography>
                        {metric.model_id && (
                            <Typography variant="body2" color="text.secondary">
                              {(models.find(m => m.id === metric.model_id)?.description) ?? ''}
                            </Typography>
                        )}
                      </>
                  )}
                </InfoRow>

                <InfoRow label="Evaluation Prompt">
                  {isEditing === 'evaluation' ? (
                      <TextField
                          key={`evaluation-prompt-field-${metric.id}`}
                          fullWidth
                          multiline
                          rows={4}
                          inputRef={evaluationPromptRef}
                          defaultValue={metric.evaluation_prompt ?? ''}
                          placeholder="Enter evaluation prompt"
                      />
                  ) : (
                      <Typography
                          component="pre"
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            bgcolor: 'action.hover',
                            borderRadius: theme => theme.shape.borderRadius * 0.25,
                            p: 1,
                            wordBreak: 'break-word',
                          }}
                      >
                        {metric.evaluation_prompt ?? '-'}
                      </Typography>
                  )}
                </InfoRow>

                <InfoRow label="Evaluation Steps">
                  {isEditing === 'evaluation' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {stepsWithIds.map((step, index) => (
                            <Box key={step.id} sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                  fullWidth
                                  multiline
                                  rows={2}
                                  inputRef={el => {
                                    if (el) stepRefs.current.set(step.id, el);
                                  }}
                                  defaultValue={step.content}
                                  placeholder={`Step ${index + 1}: Describe this evaluation step...`}
                              />
                              <IconButton
                                  onClick={() => removeStep(step.id)}
                                  disabled={stepsWithIds.length === 1}
                                  sx={{ mt: 1 }}
                                  color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                        ))}
                        <Button startIcon={<AddIcon />} onClick={addStep} sx={{ alignSelf: 'flex-start' }}>
                          Add Step
                        </Button>
                      </Box>
                  ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {metric.evaluation_steps ? (
                            metric.evaluation_steps.split('\n---\n').map((s, i) => (
                                <Paper
                                    key={i}
                                    variant="outlined"
                                    sx={{
                                      p: 2,
                                      bgcolor: 'background.paper',
                                      position: 'relative',
                                      pl: 6,
                                    }}
                                >
                                  <Typography
                                      sx={{
                                        position: 'absolute',
                                        left: 16,
                                        color: 'primary.main',
                                        fontWeight: 'bold',
                                      }}
                                  >
                                    {i + 1}
                                  </Typography>
                                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                    {s.replace(/^Step \d+:\n?/, '').trim()}
                                  </Typography>
                                </Paper>
                            ))
                        ) : (
                            <Typography>-</Typography>
                        )}
                      </Box>
                  )}
                </InfoRow>

                <InfoRow label="Reasoning Instructions">
                  {isEditing === 'evaluation' ? (
                      <TextField
                          key={`reasoning-field-${metric.id}`}
                          fullWidth
                          multiline
                          rows={4}
                          inputRef={reasoningRef}
                          defaultValue={metric.reasoning ?? ''}
                          placeholder="Enter reasoning instructions"
                      />
                  ) : (
                      <Typography
                          component="pre"
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            bgcolor: 'action.hover',
                            borderRadius: theme => theme.shape.borderRadius * 0.25,
                            p: 1,
                            wordBreak: 'break-word',
                          }}
                      >
                        {metric.reasoning ?? '-'}
                      </Typography>
                  )}
                </InfoRow>
              </EditableSection>

              {/* Result Configuration */}
              <EditableSection
                  title="Result Configuration"
                  icon={settingsIcon}
                  section="configuration"
                  isEditingSection={isEditing}
                  onEdit={handleEdit}
                  onCancel={handleCancelEdit}
                  onConfirm={handleConfirmEdit}
                  saving={isSaving}
              >
                <InfoRow label="Score Type">
                  {isEditing === 'configuration' ? (
                      <FormControl fullWidth>
                        <InputLabel>Score Type</InputLabel>
                        <Select
                            value={editData.score_type ?? 'binary'}
                            onChange={e =>
                                setEditData(prev => ({
                                  ...prev,
                                  score_type: e.target.value as ScoreType,
                                }))
                            }
                            label="Score Type"
                        >
                          <MenuItem value="binary">Binary (Pass/Fail)</MenuItem>
                          <MenuItem value="numeric">Numeric</MenuItem>
                        </Select>
                      </FormControl>
                  ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: theme => theme.shape.borderRadius * 0.25,
                              fontSize:
                                  theme?.typography?.helperText?.fontSize ?? '0.75rem',
                              fontWeight: 'medium',
                            }}
                        >
                          {metric.score_type === 'numeric'
                              ? 'Numeric'
                              : 'Binary (Pass/Fail)'}
                        </Typography>
                      </Box>
                  )}
                </InfoRow>

                {(metric.score_type === 'numeric' ||
                    editData.score_type === 'numeric') && (
                    <>
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        <InfoRow label="Minimum Score">
                          {isEditing === 'configuration' ? (
                              <TextField
                                  key={`min-score-field-${metric.id}`}
                                  type="number"
                                  value={editData.min_score ?? ''}
                                  onChange={e =>
                                      setEditData(prev => ({
                                        ...prev,
                                        min_score: Number(e.target.value),
                                      }))
                                  }
                                  fullWidth
                                  placeholder="Enter minimum score"
                              />
                          ) : (
                              <Typography variant="h6" color="text.secondary">
                                {metric.min_score}
                              </Typography>
                          )}
                        </InfoRow>

                        <InfoRow label="Maximum Score">
                          {isEditing === 'configuration' ? (
                              <TextField
                                  key={`max-score-field-${metric.id}`}
                                  type="number"
                                  value={editData.max_score ?? ''}
                                  onChange={e =>
                                      setEditData(prev => ({
                                        ...prev,
                                        max_score: Number(e.target.value),
                                      }))
                                  }
                                  fullWidth
                                  placeholder="Enter maximum score"
                              />
                          ) : (
                              <Typography variant="h6" color="text.secondary">
                                {metric.max_score}
                              </Typography>
                          )}
                        </InfoRow>
                      </Box>

                      <InfoRow label="Threshold">
                        {isEditing === 'configuration' ? (
                            <TextField
                                key={`threshold-field-${metric.id}`}
                                type="number"
                                value={editData.threshold ?? ''}
                                onChange={e =>
                                    setEditData(prev => ({
                                      ...prev,
                                      threshold: Number(e.target.value),
                                    }))
                                }
                                fullWidth
                                placeholder="Enter threshold score"
                                helperText="Minimum score required to pass"
                            />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography
                                  sx={{
                                    bgcolor: 'success.main',
                                    color: 'success.contrastText',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: theme =>
                                        theme.shape.borderRadius * 0.25,
                                    fontSize:
                                        theme?.typography?.helperText?.fontSize ??
                                        '0.75rem',
                                    fontWeight: 'medium',
                                  }}
                              >
                                ≥ {metric.threshold}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Minimum score required to pass
                              </Typography>
                            </Box>
                        )}
                      </InfoRow>
                    </>
                )}

                <InfoRow label="Result Explanation">
                  {isEditing === 'configuration' ? (
                      <TextField
                          key={`explanation-field-${metric.id}`}
                          fullWidth
                          multiline
                          rows={4}
                          inputRef={explanationRef}
                          defaultValue={metric.explanation ?? ''}
                          placeholder="Enter result explanation"
                      />
                  ) : (
                      <Typography
                          component="pre"
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            bgcolor: 'action.hover',
                            borderRadius: theme => theme.shape.borderRadius * 0.25,
                            p: 1,
                            wordBreak: 'break-word',
                          }}
                      >
                        {metric.explanation ?? '-'}
                      </Typography>
                  )}
                </InfoRow>
              </EditableSection>
            </Stack>
          </Box>
        </Stack>
      </PageContainer>
  );
}
