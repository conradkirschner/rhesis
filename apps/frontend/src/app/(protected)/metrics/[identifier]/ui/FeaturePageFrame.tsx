// src/app/(protected)/metrics/components/ui/FeaturePageFrame.tsx
'use client';

import * as React from 'react';
import { ReactNode, memo } from 'react';
import { Box, Paper, Stack, TextField, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { PageContainer } from '@toolpad/core/PageContainer';
import BaseTag, { TaggableEntity } from '@/components/common/BaseTag';
import type {
    UiFeaturePageFrameProps,
    UiEditableSectionProps,
    UiGeneralSectionProps,
    UiEvaluationSectionProps,
    UiConfigurationSectionProps,
} from './types';

export default function FeaturePageFrame(props: UiFeaturePageFrameProps & { children?: ReactNode }) {
    const { title, breadcrumbs, children } = props;
    return (
        <PageContainer title={title} breadcrumbs={[...breadcrumbs]}>
            <Stack direction="column" spacing={3}>
                <Box sx={{ flex: 1 }}>{children}</Box>
            </Stack>
        </PageContainer>
    );
}

export const EditableSection = memo(function EditableSection({
                                                                 title,
                                                                 icon,
                                                                 section,
                                                                 isEditingSection,
                                                                 onEdit,
                                                                 onCancel,
                                                                 saving,
                                                                 children,
                                                                 actionBar,
                                                             }: UiEditableSectionProps & { children: ReactNode; actionBar?: ReactNode }) {
    const isEditing = isEditingSection === section;
    return (
        <Paper sx={{ p: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    pb: 2,
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon}
                    <Typography variant="h6">{title}</Typography>
                </Box>
                {!isEditing && (
                    <Button
                        startIcon={<EditIcon />}
                        onClick={() => onEdit(section)}
                        variant="outlined"
                        size="small"
                        data-test-id="edit-section"
                    >
                        Edit Section
                    </Button>
                )}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: isEditing ? 2 : 0,
                    bgcolor: isEditing ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                    mb: isEditing ? 3 : 0,
                }}
            >
                {children}
            </Box>

            {isEditing && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{actionBar}</Box>
            )}
        </Paper>
    );
});

export const GeneralSection = memo(function GeneralSection({
                                                               isEditing,
                                                               name,
                                                               description,
                                                               tags,
                                                               tagEntity,
                                                               onNameChange,
                                                               onDescriptionChange,
                                                               onTagsChange,
                                                           }: UiGeneralSectionProps) {
    // Adapt readonly UiTagEntity -> mutable TaggableEntity expected by BaseTag
    const taggableEntity = React.useMemo<TaggableEntity | undefined>(() => {
        if (!tagEntity) return undefined;
        const mutableTags = tagEntity.tags?.map((t) => ({ name: t.name })) ?? undefined;
        // Preserve any other fields present on UiTagEntity
        return { ...(tagEntity as unknown as Record<string, unknown>), tags: mutableTags } as TaggableEntity;
    }, [tagEntity]);

    return (
        <Stack spacing={3}>
            <InfoRow label="Name">
                {isEditing ? (
                    <TextField
                        fullWidth
                        required
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter metric name"
                        data-test-id="name-input"
                    />
                ) : (
                    <Typography>{name || '-'}</Typography>
                )}
            </InfoRow>

            <InfoRow label="Description">
                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Enter metric description"
                        data-test-id="description-input"
                    />
                ) : (
                    <Typography>{description || '-'}</Typography>
                )}
            </InfoRow>

            <InfoRow label="Tags">
                <BaseTag
                    value={[...tags]} // ensure mutable array for component
                    onChange={onTagsChange}
                    placeholder="Add tags..."
                    chipColor="primary"
                    disableEdition={!isEditing}
                    entityType="Metric"
                    entity={taggableEntity}
                />
            </InfoRow>
        </Stack>
    );
});

export const EvaluationSection = memo(function EvaluationSection({
                                                                     isEditing,
                                                                     modelId,
                                                                     models,
                                                                     onModelChange,
                                                                     evaluationPrompt,
                                                                     onEvaluationPromptChange,
                                                                     steps,
                                                                     onStepChange,
                                                                     onAddStep,
                                                                     onRemoveStep,
                                                                     reasoning,
                                                                     onReasoningChange,
                                                                 }: UiEvaluationSectionProps) {
    return (
        <Stack spacing={3}>
            <InfoRow label="LLM Judge Model">
                {isEditing ? (
                    <FormControl fullWidth>
                        <InputLabel>Model</InputLabel>
                        <Select
                            label="Model"
                            value={modelId ?? ''}
                            onChange={(e) => onModelChange(String(e.target.value))}
                            data-test-id="model-select"
                        >
                            {models.map((m) => (
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
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <Typography>
                        {models.find((m) => m.id === modelId)?.name ?? modelId ?? '-'}
                    </Typography>
                )}
            </InfoRow>

            <InfoRow label="Evaluation Prompt">
                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={evaluationPrompt}
                        onChange={(e) => onEvaluationPromptChange(e.target.value)}
                        placeholder="Enter evaluation prompt"
                        data-test-id="evaluation-prompt-input"
                    />
                ) : (
                    <PreBlock>{evaluationPrompt || '-'}</PreBlock>
                )}
            </InfoRow>

            <InfoRow label="Evaluation Steps">
                {isEditing ? (
                    <Stack spacing={2}>
                        {steps.map((s, i) => (
                            <Box key={`step-${i}`} sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={s}
                                    onChange={(e) => onStepChange(i, e.target.value)}
                                    placeholder={`Step ${i + 1}: Describe this evaluation step...`}
                                    data-test-id={`step-input-${i}`}
                                />
                                <IconButton
                                    onClick={() => onRemoveStep(i)}
                                    disabled={steps.length === 1}
                                    color="error"
                                    sx={{ mt: 1 }}
                                    data-test-id={`remove-step-${i}`}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            onClick={onAddStep}
                            startIcon={<CheckIcon />}
                            variant="outlined"
                            size="small"
                            data-test-id="add-step"
                        >
                            Add Step
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        {steps.length > 0 ? (
                            steps.map((s, i) => (
                                <Paper
                                    key={`view-step-${i}`}
                                    variant="outlined"
                                    sx={{ p: 2, pl: 6, position: 'relative' }}
                                >
                                    <Typography
                                        sx={{
                                            position: 'absolute',
                                            left: 16,
                                            top: 12,
                                            color: 'primary.main',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {i + 1}
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{s}</Typography>
                                </Paper>
                            ))
                        ) : (
                            <Typography>-</Typography>
                        )}
                    </Stack>
                )}
            </InfoRow>

            <InfoRow label="Reasoning Instructions">
                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={reasoning}
                        onChange={(e) => onReasoningChange(e.target.value)}
                        placeholder="Enter reasoning instructions"
                        data-test-id="reasoning-input"
                    />
                ) : (
                    <PreBlock>{reasoning || '-'}</PreBlock>
                )}
            </InfoRow>
        </Stack>
    );
});

export const ConfigurationSection = memo(function ConfigurationSection({
                                                                           isEditing,
                                                                           scoreType,
                                                                           onScoreTypeChange,
                                                                           minScore,
                                                                           maxScore,
                                                                           threshold,
                                                                           onMinScoreChange,
                                                                           onMaxScoreChange,
                                                                           onThresholdChange,
                                                                           explanation,
                                                                           onExplanationChange,
                                                                       }: UiConfigurationSectionProps) {
    return (
        <Stack spacing={3}>
            <InfoRow label="Score Type">
                {isEditing ? (
                    <FormControl fullWidth>
                        <InputLabel>Score Type</InputLabel>
                        <Select
                            label="Score Type"
                            value={scoreType}
                            onChange={(e) =>
                                onScoreTypeChange(e.target.value as 'binary' | 'numeric')
                            }
                            data-test-id="score-type-select"
                        >
                            <MenuItem value="binary">Binary (Pass/Fail)</MenuItem>
                            <MenuItem value="numeric">Numeric</MenuItem>
                        </Select>
                    </FormControl>
                ) : (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Typography
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 0.5,
                                fontSize: (t) => t.typography.caption.fontSize,
                                fontWeight: 'medium',
                            }}
                        >
                            {scoreType === 'numeric' ? 'Numeric' : 'Binary (Pass/Fail)'}
                        </Typography>
                    </Box>
                )}
            </InfoRow>

            {scoreType === 'numeric' && (
                <>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <InfoRow label="Minimum Score">
                            {isEditing ? (
                                <TextField
                                    type="number"
                                    value={typeof minScore === 'number' ? minScore : ''}
                                    onChange={(e) => onMinScoreChange(Number(e.target.value))}
                                    fullWidth
                                    placeholder="Enter minimum score"
                                    data-test-id="min-score-input"
                                />
                            ) : (
                                <Typography variant="h6" color="text.secondary">
                                    {minScore}
                                </Typography>
                            )}
                        </InfoRow>

                        <InfoRow label="Maximum Score">
                            {isEditing ? (
                                <TextField
                                    type="number"
                                    value={typeof maxScore === 'number' ? maxScore : ''}
                                    onChange={(e) => onMaxScoreChange(Number(e.target.value))}
                                    fullWidth
                                    placeholder="Enter maximum score"
                                    data-test-id="max-score-input"
                                />
                            ) : (
                                <Typography variant="h6" color="text.secondary">
                                    {maxScore}
                                </Typography>
                            )}
                        </InfoRow>
                    </Box>

                    <InfoRow label="Threshold">
                        {isEditing ? (
                            <TextField
                                type="number"
                                value={typeof threshold === 'number' ? threshold : ''}
                                onChange={(e) => onThresholdChange(Number(e.target.value))}
                                fullWidth
                                placeholder="Enter threshold score"
                                helperText="Minimum score required to pass"
                                data-test-id="threshold-input"
                            />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography
                                    sx={{
                                        bgcolor: 'success.main',
                                        color: 'success.contrastText',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 0.5,
                                        fontSize: (t) => t.typography.caption.fontSize,
                                        fontWeight: 'medium',
                                    }}
                                >
                                    ≥ {threshold}
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
                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={explanation}
                        onChange={(e) => onExplanationChange(e.target.value)}
                        placeholder="Enter result explanation"
                        data-test-id="explanation-input"
                    />
                ) : (
                    <PreBlock>{explanation || '-'}</PreBlock>
                )}
            </InfoRow>
        </Stack>
    );
});

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
                {label}
            </Typography>
            <Box>{children}</Box>
        </Box>
    );
}

function PreBlock({ children }: { children: ReactNode }) {
    return (
        <Typography
            component="pre"
            variant="body2"
            sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                bgcolor: 'action.hover',
                borderRadius: 0.5,
                p: 1,
                wordBreak: 'break-word',
            }}
        >
            {children}
        </Typography>
    );
}
