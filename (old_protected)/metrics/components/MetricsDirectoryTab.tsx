'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';
import { DeleteModal } from '@/components/common/DeleteModal';
import MetricCard from './MetricCard';
import MetricTypeDialog from './MetricTypeDialog';

import type {
    Behavior as ApiBehavior,
    RhesisBackendAppUtilsSchemaFactoryMetricDetail1 as MetricDetail1,
    RhesisBackendAppUtilsSchemaFactoryMetricDetail2 as MetricDetail2,
} from '@/api-client/types.gen';

import {
    addBehaviorToMetricMetricsMetricIdBehaviorsBehaviorIdPostMutation,
    deleteMetricMetricsMetricIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface FilterState {
    search: string;
    backend: string[];
    type: string[];
    scoreType: string[];
}
interface FilterOptions {
    backend: { type_value: string }[];
    type: { type_value: string; description: string }[];
    scoreType: { value: string; label: string }[];
}

type MetricDetail = MetricDetail1 | MetricDetail2;

type BehaviorMetrics = {
    [behaviorId: string]: {
        metrics: MetricDetail[];
        isLoading: boolean;
        error: string | null;
    };
};

interface AssignMetricDialogProps {
    open: boolean;
    onClose: () => void;
    onAssign: (behaviorId: string) => void;
    behaviors: ApiBehavior[];
    isLoading: boolean;
    error: string | null;
}

function AssignMetricDialog({
                                open,
                                onClose,
                                onAssign,
                                behaviors,
                                isLoading,
                                error,
                            }: AssignMetricDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add to Behavior</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select a behavior to add this metric to:
                </DialogContentText>
                {isLoading ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                            }}
                        >
                            <CircularProgress size={20} />
                            <Typography>Loading behaviors...</Typography>
                        </Box>
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : behaviors.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography color="text.secondary">No behaviors available</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        {[...behaviors]
                            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                            .map((behavior) => (
                                <Button
                                    key={behavior.id}
                                    variant="outlined"
                                    onClick={() => onAssign(behavior.id??'')}
                                    fullWidth
                                >
                                    {behavior.name || 'Unnamed Behavior'}
                                </Button>
                            ))}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}

interface MetricsDirectoryTabProps {
    organizationId: string;
    behaviors: ApiBehavior[];
    metrics: MetricDetail2[]; // list variant from API
    filters: FilterState;
    filterOptions: FilterOptions;
    isLoading: boolean;
    error: string | null;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    setMetrics: React.Dispatch<React.SetStateAction<MetricDetail2[]>>; // setter aligned
    setBehaviorMetrics: React.Dispatch<React.SetStateAction<BehaviorMetrics>>; // EXACT shape as parent
    setBehaviorsWithMetrics: React.Dispatch<
        React.SetStateAction<(ApiBehavior & { metrics?: { id: string }[] })[]>
    >;
}

function isValidMetricType(
    type: string | undefined | null
): type is 'custom-prompt' | 'api-call' | 'custom-code' | 'grading' {
    return (
        type === 'custom-prompt' ||
        type === 'api-call' ||
        type === 'custom-code' ||
        type === 'grading'
    );
}

export default function MetricsDirectoryTab({
                                                behaviors,
                                                metrics,
                                                filters,
                                                filterOptions,
                                                isLoading,
                                                error,
                                                setFilters,
                                                setMetrics,
                                                setBehaviorMetrics,
                                                setBehaviorsWithMetrics,
                                            }: MetricsDirectoryTabProps) {
    const router = useRouter();
    const notifications = useNotifications();
    const theme = useTheme();

    const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
    const [selectedMetric, setSelectedMetric] = React.useState<MetricDetail2 | null>(null);
    const [createMetricOpen, setCreateMetricOpen] = React.useState(false);
    const [deleteMetricDialogOpen, setDeleteMetricDialogOpen] = React.useState(false);
    const [metricToDeleteCompletely, setMetricToDeleteCompletely] =
        React.useState<{ id: string; name: string } | null>(null);

    const addBehaviorToMetric = useMutation(addBehaviorToMetricMetricsMetricIdBehaviorsBehaviorIdPostMutation());
    const deleteMetric = useMutation(deleteMetricMetricsMetricIdDeleteMutation());

    const handleFilterChange = (
        filterType: keyof FilterState,
        value: string | string[]
    ) => {
        setFilters((prev) => ({
            ...prev,
            [filterType]: value,
        }));
    };

    const getFilteredMetrics = React.useCallback(() => {
        const q = filters.search.trim().toLowerCase();

        return metrics.filter((metric) => {
            const name = (metric.name ?? '').toLowerCase();
            const desc = (metric.description ?? '').toLowerCase();
            const mt = metric.metric_type?.type_value?.toLowerCase() ?? '';

            const searchMatch = q === '' || name.includes(q) || desc.includes(q) || mt.includes(q);

            const backendMatch =
                filters.backend.length === 0 ||
                (metric.backend_type?.type_value &&
                    filters.backend.includes(metric.backend_type.type_value.toLowerCase()));

            const typeMatch =
                filters.type.length === 0 ||
                (metric.metric_type?.type_value &&
                    filters.type.includes(metric.metric_type.type_value));

            const scoreTypeMatch =
                filters.scoreType.length === 0 ||
                (metric.score_type && filters.scoreType.includes(metric.score_type));

            return searchMatch && backendMatch && typeMatch && scoreTypeMatch;
        });
    }, [metrics, filters]);

    const hasActiveFilters = () =>
        filters.search !== '' ||
        filters.backend.length > 0 ||
        filters.type.length > 0 ||
        filters.scoreType.length > 0;

    const handleResetFilters = () => {
        setFilters({
            search: '',
            backend: [],
            type: [],
            scoreType: [],
        });
    };

    const handleMetricDetail = (metricId: string) => {
        router.push(`/metrics/${metricId}`);
    };

    const handleAssignMetricToBehavior = async (behaviorId: string, metricId: string) => {
        try {
            await addBehaviorToMetric.mutateAsync({
                path: { metric_id: metricId, behavior_id: behaviorId },
            });

            setMetrics((prev) =>
                prev.map((m) => {
                    if (m.id !== metricId) return m;
                    const list = Array.isArray(m.behaviors) ? m.behaviors : [];
                    const exists = list.some((b) => (typeof b === 'string' ? b === behaviorId : b.id === behaviorId));
                    if (exists) return m;
                    // MetricDetail2.behaviors is Array<BehaviorReference>, so add { id }
                    const nextBehaviors = [...list, { id: behaviorId }];
                    return { ...m, behaviors: nextBehaviors } as MetricDetail2;
                })
            );

            const target = metrics.find((m) => m.id === metricId);
            if (target) {
                setBehaviorMetrics((prev) => ({
                    ...prev,
                    [behaviorId]: {
                        ...(prev[behaviorId] ?? { metrics: [], isLoading: false, error: null }),
                        metrics: [ ...(prev[behaviorId]?.metrics ?? []), target ],
                        isLoading: false,
                        error: null,
                    },
                }));

                setBehaviorsWithMetrics((prev) =>
                    prev.map((b) => {
                        if (b.id !== behaviorId) return b;
                        const ids = (b.metrics ?? []).map((r) => r.id);
                        if (ids.includes(metricId)) return b;
                        return { ...b, metrics: [ ...(b.metrics ?? []), { id: metricId } ] };
                    })
                );
            }

            notifications.show('Successfully assigned metric to behavior', {
                severity: 'success',
                autoHideDuration: 4000,
            });
        } catch (err) {
            notifications.show('Failed to assign metric to behavior', {
                severity: 'error',
                autoHideDuration: 4000,
            });
        }
    };

    const handleAssignMetric = (behaviorId: string) => {
        if (selectedMetric) {
            void handleAssignMetricToBehavior(behaviorId, selectedMetric.id);
        }
        setAssignDialogOpen(false);
        setSelectedMetric(null);
    };

    const handleDeleteMetric = (metricId: string, metricName: string) => {
        setMetricToDeleteCompletely({ id: metricId, name: metricName });
        setDeleteMetricDialogOpen(true);
    };

    const handleConfirmDeleteMetric = async () => {
        if (!metricToDeleteCompletely) return;

        try {
            await deleteMetric.mutateAsync({ path: { metric_id: metricToDeleteCompletely.id } });

            setMetrics((prev) => prev.filter((m) => m.id !== metricToDeleteCompletely.id));

            setBehaviorMetrics((prev) => {
                const next: BehaviorMetrics = {};
                Object.entries(prev).forEach(([bid, entry]) => {
                    next[bid] = {
                        ...entry,
                        metrics: entry.metrics.filter((m) => m.id !== metricToDeleteCompletely.id),
                    };
                });
                return next;
            });

            setBehaviorsWithMetrics((prev) =>
                prev.map((b) => ({
                    ...b,
                    metrics: (b.metrics ?? []).filter((r) => r.id !== metricToDeleteCompletely.id),
                }))
            );

            notifications.show('Metric deleted successfully', {
                severity: 'success',
                autoHideDuration: 4000,
            });
        } catch (err) {
            notifications.show('Failed to delete metric', {
                severity: 'error',
                autoHideDuration: 4000,
            });
        } finally {
            setDeleteMetricDialogOpen(false);
            setMetricToDeleteCompletely(null);
        }
    };

    const handleCancelDeleteMetric = () => {
        setDeleteMetricDialogOpen(false);
        setMetricToDeleteCompletely(null);
    };

    const filteredMetrics = getFilteredMetrics();
    const activeBehaviors = behaviors.filter((b) => b.name && b.name.trim() !== '');

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    minHeight: '400px',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} />
                    <Typography>Loading metrics directory...</Typography>
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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search and Filters */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Stack spacing={3}>
                    {/* Header with Search and Create */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <TextField
                            fullWidth
                            placeholder="Search metrics..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            variant="filled"
                            hiddenLabel
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateMetricOpen(true)}
                            sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
                        >
                            New Metric
                        </Button>
                        {hasActiveFilters() && (
                            <Button
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={handleResetFilters}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Reset
                            </Button>
                        )}
                    </Box>

                    {/* Filter Groups */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {/* Backend Filter */}
                        <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
                            <InputLabel id="backend-filter-label">Backend</InputLabel>
                            <Select
                                labelId="backend-filter-label"
                                id="backend-filter"
                                multiple
                                value={filters.backend}
                                onChange={(e) => handleFilterChange('backend', e.target.value as string[])}
                                label="Backend"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.length === 0 ? (
                                            <em>Select backend</em>
                                        ) : (
                                            selected.map((value) => <Chip key={value} label={value} size="small" />)
                                        )}
                                    </Box>
                                )}
                                MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
                            >
                                <MenuItem disabled value="">
                                    <em>Select backend</em>
                                </MenuItem>
                                {filterOptions.backend.map((option) => (
                                    <MenuItem key={option.type_value} value={option.type_value.toLowerCase()}>
                                        {option.type_value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Metric Type Filter */}
                        <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
                            <InputLabel id="type-filter-label">Metric Type</InputLabel>
                            <Select
                                labelId="type-filter-label"
                                id="type-filter"
                                multiple
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value as string[])}
                                label="Metric Type"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.length === 0 ? (
                                            <em>Select metric type</em>
                                        ) : (
                                            selected.map((value) => (
                                                <Chip
                                                    key={value}
                                                    label={value
                                                        .replace(/-/g, ' ')
                                                        .split(' ')
                                                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                        .join(' ')}
                                                    size="small"
                                                />
                                            ))
                                        )}
                                    </Box>
                                )}
                                MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
                            >
                                <MenuItem disabled value="">
                                    <em>Select metric type</em>
                                </MenuItem>
                                {filterOptions.type.map((option) => (
                                    <MenuItem key={option.type_value} value={option.type_value}>
                                        <Box>
                                            <Typography>
                                                {option.type_value
                                                    .replace(/-/g, ' ')
                                                    .split(' ')
                                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                    .join(' ')}
                                            </Typography>
                                            {option.description && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {option.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Score Type Filter */}
                        <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
                            <InputLabel id="score-type-filter-label">Score Type</InputLabel>
                            <Select
                                labelId="score-type-filter-label"
                                id="score-type-filter"
                                multiple
                                value={filters.scoreType}
                                onChange={(e) => handleFilterChange('scoreType', e.target.value as string[])}
                                label="Score Type"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.length === 0 ? (
                                            <em>Select score type</em>
                                        ) : (
                                            selected.map((value) => (
                                                <Chip
                                                    key={value}
                                                    label={
                                                        filterOptions.scoreType.find((opt) => opt.value === value)?.label || value
                                                    }
                                                    size="small"
                                                />
                                            ))
                                        )}
                                    </Box>
                                )}
                                MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
                            >
                                <MenuItem disabled value="">
                                    <em>Select score type</em>
                                </MenuItem>
                                {filterOptions.scoreType.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Stack>
            </Box>

            {/* Metrics grid */}
            <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                <Stack
                    spacing={3}
                    sx={{
                        '& > *': {
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 3,
                            '& > *': {
                                flex: {
                                    xs: '1 1 100%',
                                    sm: '1 1 calc(50% - 12px)',
                                    md: '1 1 calc(33.333% - 16px)',
                                },
                                minWidth: { xs: '100%', sm: '300px', md: '320px' },
                                maxWidth: {
                                    xs: '100%',
                                    sm: 'calc(50% - 12px)',
                                    md: 'calc(33.333% - 16px)',
                                },
                            },
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {filteredMetrics.map((metric) => {
                            const assignedBehaviors = activeBehaviors.filter((b) => {
                                if (!Array.isArray(metric.behaviors)) return false;
                                const ids = metric.behaviors.map((val) =>
                                     val.id
                                );
                                return ids.includes(b.id as string);
                            });

                            const behaviorNames = assignedBehaviors.map((b) => b.name || 'Unnamed Behavior');

                            const mt = metric.metric_type?.type_value ?? undefined;
                            const typeKind = isValidMetricType(mt) ? mt : undefined;
                            const backendStr = metric.backend_type?.type_value ?? undefined;
                            const metricTypeStr = metric.metric_type?.type_value ?? undefined;

                            return (
                                <Box
                                    key={metric.id}
                                    sx={{
                                        position: 'relative',
                                        flex: {
                                            xs: '1 1 100%',
                                            sm: '1 1 calc(50% - 12px)',
                                            md: '1 1 calc(33.333% - 16px)',
                                        },
                                        minWidth: { xs: '100%', sm: '300px', md: '320px' },
                                        maxWidth: {
                                            xs: '100%',
                                            sm: 'calc(50% - 12px)',
                                            md: 'calc(33.333% - 16px)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            display: 'flex',
                                            gap: 1,
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
                                                },
                                            }}
                                        >
                                            <OpenInNewIcon fontSize="inherit" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedMetric(metric);
                                                setAssignDialogOpen(true);
                                            }}
                                            sx={{
                                                padding: '2px',
                                                '& .MuiSvgIcon-root': {
                                                    fontSize: theme?.typography?.helperText?.fontSize || '0.75rem',
                                                },
                                            }}
                                        >
                                            <AddIcon fontSize="inherit" />
                                        </IconButton>
                                        {/* Only show delete button for unassigned custom metrics */}
                                        {assignedBehaviors.length === 0 &&
                                            metric.backend_type?.type_value?.toLowerCase() === 'custom' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteMetric(metric.id, metric.name ?? '');
                                                    }}
                                                    sx={{
                                                        padding: '2px',
                                                        '& .MuiSvgIcon-root': {
                                                            fontSize: theme?.typography?.helperText?.fontSize || '0.75rem',
                                                        },
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="inherit" />
                                                </IconButton>
                                            )}
                                    </Box>
                                    <MetricCard
                                        type={typeKind}
                                        title={metric.name ?? ''}
                                        description={metric.description ?? ''}
                                        backend={backendStr}
                                        metricType={metricTypeStr}
                                        scoreType={metric.score_type}
                                        usedIn={behaviorNames}
                                        showUsage={true}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Stack>
            </Box>

            {/* Dialogs */}
            <DeleteModal
                open={deleteMetricDialogOpen}
                onClose={handleCancelDeleteMetric}
                onConfirm={handleConfirmDeleteMetric}
                isLoading={deleteMetric.isPending}
                itemType="metric"
                itemName={metricToDeleteCompletely?.name}
            />

            <AssignMetricDialog
                open={assignDialogOpen}
                onClose={() => {
                    setAssignDialogOpen(false);
                    setSelectedMetric(null);
                }}
                onAssign={handleAssignMetric}
                behaviors={behaviors.filter((b) => b.name && b.name.trim() !== '')}
                isLoading={isLoading}
                error={error}
            />

            <MetricTypeDialog open={createMetricOpen} onClose={() => setCreateMetricOpen(false)} />
        </Box>
    );
}
