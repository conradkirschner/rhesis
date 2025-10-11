'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/common/NotificationContext';
import MetricCard from './MetricCard';
import SectionEditDrawer from './DimensionDrawer';
import type { UUID } from 'crypto';
import { useMutation } from '@tanstack/react-query';

/** Generated types */
import type {
  Behavior as ApiBehavior,
  Metric,
  RhesisBackendAppUtilsSchemaFactoryMetricDetail1 as MetricDetail1,
  RhesisBackendAppUtilsSchemaFactoryMetricDetail2 as MetricDetail2,
} from '@/api-client/types.gen';

/** Generated mutations */
import {
  createBehaviorBehaviorsPostMutation,
  updateBehaviorBehaviorsBehaviorIdPutMutation,
  deleteBehaviorBehaviorsBehaviorIdDeleteMutation,
  removeBehaviorFromMetricMetricsMetricIdBehaviorsBehaviorIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

type MetricDetail = MetricDetail1 | MetricDetail2;
type BehaviorWithMetricIds = ApiBehavior & { metrics?: Array<Pick<Metric, 'id'>> };

interface BehaviorMetricsState {
  [behaviorId: string]: {
    metrics: MetricDetail[]; // <-- detail shape with metric_type/backend_type
    isLoading: boolean;
    error: string | null;
  };
}

interface SelectedMetricsTabProps {
  organizationId: UUID;
  behaviorsWithMetrics: BehaviorWithMetricIds[];
  behaviorMetrics: BehaviorMetricsState;
  isLoading: boolean;
  error: string | null;
  setBehaviors: React.Dispatch<React.SetStateAction<ApiBehavior[]>>;
  setBehaviorsWithMetrics: React.Dispatch<React.SetStateAction<BehaviorWithMetricIds[]>>;
  setBehaviorMetrics: React.Dispatch<React.SetStateAction<BehaviorMetricsState>>;
  onTabChange: () => void;
}

// Strict union for MetricCard.type
function toMetricKind(
    t: string | null | undefined,
): 'custom-prompt' | 'api-call' | 'custom-code' | 'grading' | undefined {
  return t === 'custom-prompt' || t === 'api-call' || t === 'custom-code' || t === 'grading'
      ? t
      : undefined;
}
const toUndef = (v: string | null | undefined): string | undefined => (v ?? undefined);

export default function SelectedMetricsTab({
                                             organizationId,
                                             behaviorsWithMetrics,
                                             behaviorMetrics,
                                             isLoading,
                                             error,
                                             setBehaviors,
                                             setBehaviorsWithMetrics,
                                             setBehaviorMetrics,
                                             onTabChange,
                                           }: SelectedMetricsTabProps) {
  const router = useRouter();
  const notifications = useNotifications();
  const theme = useTheme();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<{
    key: UUID | null;
    title: string;
    description: string;
  } | null>(null);
  const [isNewSection, setIsNewSection] = React.useState(false);
  const [drawerLoading, setDrawerLoading] = React.useState(false);
  const [drawerError, setDrawerError] = React.useState<string>();

  // Mutations
  const createBehaviorMutation = useMutation(createBehaviorBehaviorsPostMutation());
  const updateBehaviorMutation = useMutation(updateBehaviorBehaviorsBehaviorIdPutMutation());
  const deleteBehaviorMutation = useMutation(deleteBehaviorBehaviorsBehaviorIdDeleteMutation());
  const removeMetricFromBehaviorMutation = useMutation(
      removeBehaviorFromMetricMetricsMetricIdBehaviorsBehaviorIdDeleteMutation(),
  );

  const handleEditSection = (key: UUID, title: string, description: string) => {
    setEditingSection({ key, title, description });
    setIsNewSection(false);
    setDrawerOpen(true);
  };

  const handleAddNewSection = () => {
    setEditingSection({ key: null, title: '', description: '' });
    setIsNewSection(true);
    setDrawerOpen(true);
  };

  const handleSaveSection = async (title: string, description: string, organization_id: UUID) => {
    try {
      setDrawerLoading(true);
      setDrawerError(undefined);

      if (isNewSection) {
        const created = await createBehaviorMutation.mutateAsync({
          body: { name: title, description: description || null, organization_id },
        });

        setBehaviors((prev) => [...prev, created as ApiBehavior]);
        setBehaviorMetrics((prev) => ({
          ...prev,
          [(created).id]: { metrics: [], isLoading: false, error: null },
        }));
        setBehaviorsWithMetrics((prev) => [
          ...prev,
          { ...(created as ApiBehavior), metrics: [] } as BehaviorWithMetricIds,
        ]);

        notifications.show('Dimension created successfully', { severity: 'success', autoHideDuration: 4000 });
      } else if (editingSection?.key) {
        const updated = await updateBehaviorMutation.mutateAsync({
          path: { behavior_id: editingSection.key as string },
          body: { name: title, description: description || null, organization_id },
        });

        const updatedName = updated.name ?? '';
        const updatedDesc = updated.description ?? null;

        setBehaviors((prev) =>
            prev.map((b) => (b.id === (editingSection.key as string) ? { ...b, name: updatedName, description: updatedDesc } : b)),
        );
        setBehaviorsWithMetrics((prev) =>
            prev.map((b) => (b.id === (editingSection.key as string) ? { ...b, name: updatedName, description: updatedDesc } : b)),
        );

        notifications.show('Dimension updated successfully', { severity: 'success', autoHideDuration: 4000 });
      }
      setDrawerOpen(false);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to save dimension');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!isNewSection && editingSection?.key) {
      const behaviorId = editingSection.key as string;

      try {
        const existing = behaviorMetrics[behaviorId];
        if (existing && existing.metrics.length > 0) {
          await Promise.all(
              existing.metrics.map((metric) =>
                  removeMetricFromBehaviorMutation.mutateAsync({
                    path: { metric_id: metric.id as string, behavior_id: behaviorId },
                  }),
              ),
          );
        }

        await deleteBehaviorMutation.mutateAsync({ path: { behavior_id: behaviorId } });

        setBehaviors((prev) => prev.filter((b) => b.id !== behaviorId));
        setBehaviorsWithMetrics((prev) => prev.filter((b) => b.id !== behaviorId));
        setBehaviorMetrics((prev) => {
          const next = { ...prev };
          delete next[behaviorId];
          return next;
        });

        notifications.show('Dimension deleted successfully', { severity: 'success', autoHideDuration: 4000 });
        setDrawerOpen(false);
      } catch (err) {
        notifications.show(err instanceof Error ? err.message : 'Failed to delete dimension', {
          severity: 'error',
          autoHideDuration: 4000,
        });
      }
    } else {
      setDrawerOpen(false);
    }
  };

  const handleMetricDetail = (metricId: string) => {
    router.push(`/metrics/${metricId}`);
  };

  const handleRemoveMetricFromBehavior = async (behaviorId: string, metricId: string) => {
    try {
      await removeMetricFromBehaviorMutation.mutateAsync({
        path: { metric_id: metricId, behavior_id: behaviorId },
      });

      setBehaviorMetrics((prev) => ({
        ...prev,
        [behaviorId]: {
          ...(prev[behaviorId] ?? { metrics: [], isLoading: false, error: null }),
          metrics: (prev[behaviorId]?.metrics ?? []).filter((m) => m.id !== metricId),
          isLoading: false,
          error: null,
        },
      }));

      setBehaviorsWithMetrics((prev) =>
          prev.map((b) =>
              b.id === behaviorId
                  ? { ...b, metrics: (b.metrics ?? []).filter((mx) => mx.id !== metricId) }
                  : b,
          ),
      );

      notifications.show('Successfully removed metric from behavior', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch {
      notifications.show('Failed to remove metric from behavior', { severity: 'error', autoHideDuration: 4000 });
    }
  };

  const renderSection = (behavior: BehaviorWithMetricIds) => {
    // pull full detail objects (with metric_type/backend_type) from the state map
    const detailed: MetricDetail[] = behaviorMetrics[behavior.id ?? '']?.metrics ?? [];

    return (
        <Box key={behavior.id} sx={{ mb: theme.spacing(4) }}>
          <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: theme.spacing(1),
                pb: theme.spacing(1),
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
          >
            <Typography
                variant="h6"
                component="h2"
                sx={{ fontWeight: theme.typography.fontWeightBold, color: theme.palette.text.primary }}
            >
              {behavior.name}
            </Typography>
            <IconButton
                onClick={() => handleEditSection(behavior.id as UUID, behavior.name ?? '', behavior.description ?? '')}
                size="small"
                sx={{ color: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.action.hover } }}
            >
              <EditIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(3) }}>
            {behavior.description || 'No description provided'}
          </Typography>

          {detailed.length > 0 ? (
              <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: theme.spacing(3),
                    width: '100%',
                    px: 0,
                  }}
              >
                {detailed.map((metric) => {
                  const metricTypeStr = toUndef(metric.metric_type?.type_value);
                  const backendStr = toUndef(metric.backend_type?.type_value);
                  const typeKind = toMetricKind(metricTypeStr);
                  const behaviorNames = [behavior.name ?? ''];

                  return (
                      <Box key={metric.id} sx={{ position: 'relative' }}>
                        <Box
                            sx={{
                              position: 'absolute',
                              top: theme.spacing(1),
                              right: theme.spacing(1),
                              display: 'flex',
                              gap: theme.spacing(0.5),
                              zIndex: 1,
                            }}
                        >
                          <IconButton
                              size="small"
                              onClick={() => handleMetricDetail(metric.id)}
                              sx={{
                                padding: '2px',
                                '& .MuiSvgIcon-root': {
                                  fontSize: theme?.typography?.helperText?.fontSize || '0.75rem',
                                  color: 'currentColor',
                                },
                              }}
                          >
                            <OpenInNewIcon fontSize="inherit" />
                          </IconButton>
                          <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleRemoveMetricFromBehavior(String(behavior.id), String(metric.id));
                              }}
                              sx={{
                                padding: '2px',
                                '& .MuiSvgIcon-root': {
                                  fontSize: theme?.typography?.helperText?.fontSize || '0.75rem',
                                  color: 'currentColor',
                                },
                              }}
                          >
                            <CloseIcon fontSize="inherit" />
                          </IconButton>
                        </Box>

                        <MetricCard
                            type={typeKind}
                            title={metric.name ?? ''}
                            description={toUndef(metric.description)??''}
                            backend={backendStr}
                            metricType={metricTypeStr}
                            scoreType={metric.score_type}
                            usedIn={behaviorNames}
                            showUsage={false}
                        />
                      </Box>
                  );
                })}
              </Box>
          ) : (
              <Paper
                  elevation={0}
                  sx={{
                    p: theme.spacing(3),
                    textAlign: 'center',
                    backgroundColor: theme.palette.action.hover,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: theme.spacing(2),
                    borderRadius: theme.shape.borderRadius,
                    border: `1px dashed ${theme.palette.divider}`,
                  }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: theme.typography.fontWeightMedium }}>
                  No metrics assigned to this behavior
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={onTabChange}
                    sx={{
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                      '&:hover': { backgroundColor: theme.palette.primary.light, borderColor: theme.palette.primary.main },
                    }}
                >
                  Add Metric
                </Button>
              </Paper>
          )}
        </Box>
    );
  };

  if (isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: '200px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading behaviors and metrics...</Typography>
          </Box>
        </Box>
    );
  }

  if (error) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
    );
  }

  return (
      <Box sx={{ width: '100%', px: theme.spacing(3), pb: theme.spacing(4) }}>
        {behaviorsWithMetrics
            .filter((b) => (b.name ?? '').trim() !== '')
            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
            .map((behavior) => renderSection(behavior))}

        <Box
            sx={{
              mt: 4,
              p: 3,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: (th) => th.shape.borderRadius * 0.25,
              display: 'flex',
              justifyContent: 'center',
              mb: 8,
            }}
        >
          <Button startIcon={<AddIcon />} onClick={handleAddNewSection} sx={{ color: 'text.secondary' }}>
            Add New Dimension
          </Button>
        </Box>

        {editingSection && (
            <SectionEditDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editingSection.title}
                description={editingSection.description}
                onSave={handleSaveSection}
                onDelete={
                  !isNewSection &&
                  editingSection.key &&
                  (behaviorMetrics[editingSection.key as unknown as string]?.metrics?.length ?? 0) === 0
                      ? handleDeleteSection
                      : undefined
                }
                isNew={isNewSection}
                loading={drawerLoading}
                error={drawerError}
                organization_id={organizationId}
            />
        )}
      </Box>
  );
}
