'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';

import {
    readBehaviorsBehaviorsGetOptions,
    readMetricsMetricsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import type {
    Behavior,
    RhesisBackendAppUtilsSchemaFactoryMetricDetail1 as MetricDetail1,
    RhesisBackendAppUtilsSchemaFactoryMetricDetail2 as MetricDetail2,
} from '@/api-client/types.gen';

import SelectedMetricsTab from './SelectedMetricsTab';
import MetricsDirectoryTab from './MetricsDirectoryTab';

type MetricDetail = MetricDetail1 | MetricDetail2;

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`metrics-tabpanel-${index}`}
            aria-labelledby={`metrics-tab-${index}`}
            {...other}
            style={{ height: '100%' }}
        >
            {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `metrics-tab-${index}`,
        'aria-controls': `metrics-tabpanel-${index}`,
    };
}

/** Local filter state */
interface FilterState {
    search: string;
    backend: string[];
    type: string[];
    scoreType: string[];
}
const initialFilterState: FilterState = {
    search: '',
    backend: [],
    type: [],
    scoreType: [],
};

interface FilterOptions {
    backend: { type_value: string }[];
    type: { type_value: string; description: string }[];
    scoreType: { value: string; label: string }[];
}
const initialFilterOptions: FilterOptions = {
    backend: [],
    type: [],
    scoreType: [
        { value: 'binary', label: 'Binary (Pass/Fail)' },
        { value: 'numeric', label: 'Numeric' },
    ],
};

interface MetricsClientProps {
    organizationId: string;
}


type BehaviorMetrics = {
    [behaviorId: string]: {
        metrics: MetricDetail[];
        isLoading: boolean;
        error: string | null;
    };
};

export default function MetricsClientComponent({
                                                   organizationId,
                                               }: MetricsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const notifications = useNotifications();

    // init tab from URL
    const initialTab = React.useMemo(() => {
        const tab = searchParams.get('tab');
        return tab === 'selected' ? 1 : 0;
    }, [searchParams]);
    const [value, setValue] = React.useState(initialTab);

    const [behaviors, setBehaviors] = React.useState<Behavior[]>([]);
    const [behaviorsWithMetrics, setBehaviorsWithMetrics] =
        React.useState<(Behavior & { metrics?: { id: string }[] })[]>([]);

    const [metrics, setMetrics] = React.useState<MetricDetail2[]>([]);
    const [isLoadingSelectedMetrics, setIsLoadingSelectedMetrics] = React.useState(true);
    const [isLoadingMetricsDirectory, setIsLoadingMetricsDirectory] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [filters, setFilters] = React.useState<FilterState>(initialFilterState);
    const [filterOptions, setFilterOptions] =
        React.useState<FilterOptions>(initialFilterOptions);
    const [behaviorMetrics, setBehaviorMetrics] = React.useState<BehaviorMetrics>({});

    const behaviorsOpts = readBehaviorsBehaviorsGetOptions({
        query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
    });
    const metricsOpts = readMetricsMetricsGetOptions({
        query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
    });

    const behaviorsQuery = useQuery({
        ...behaviorsOpts,
        staleTime: 60_000,
        select: (data) => data.data,
    });

    const metricsQuery = useQuery({
        ...metricsOpts,
        staleTime: 60_000,
        select: (data) => data.data,
    });

    React.useEffect(() => {
        setIsLoadingSelectedMetrics(behaviorsQuery.isPending);
        setIsLoadingMetricsDirectory(metricsQuery.isPending);

        if (behaviorsQuery.isError || metricsQuery.isError) {
            const message =
                (behaviorsQuery.error as Error | undefined)?.message ??
                (metricsQuery.error as Error | undefined)?.message ??
                'Failed to load metrics data';
            setError(message);
            notifications.show('Failed to load metrics data', {
                severity: 'error',
                autoHideDuration: 4000,
            });
            return;
        }

        if (behaviorsQuery.isSuccess && metricsQuery.isSuccess) {
            const behaviorsData = behaviorsQuery.data ?? [];
            const metricsData = metricsQuery.data ?? [];

            // Map of metricId -> full MetricDetail (from list)
            const metricById = new Map<string, MetricDetail>();
            metricsData.forEach((m) => metricById.set(m.id, m));

            // Per-behavior cache with full details
            const perBehavior: BehaviorMetrics = {};
            behaviorsData.forEach((b) => {
                const bid = b.id ?? '';
                if (!bid) return;
                const fullDetails = (b.metrics ?? [])
                    .map((r) => r.id)
                    .map((id) => metricById.get(id))
                    .filter(Boolean) as MetricDetail[];
                perBehavior[bid] = {
                    metrics: fullDetails,
                    isLoading: false,
                    error: null,
                };
            });

            // Filter options from detailed metrics (use relation refs directly)
            const uniqueBackend = new Map<string, { type_value: string }>();
            const uniqueMetric = new Map<string, { type_value: string; description: string }>();

            metricsData.forEach((m) => {
                const bt = m.backend_type?.type_value ?? null;
                if (bt) {
                    const pretty = bt.charAt(0).toUpperCase() + bt.slice(1);
                    uniqueBackend.set(bt, { type_value: pretty });
                }
                const mt = m.metric_type?.type_value ?? null;
                if (mt) {
                    uniqueMetric.set(mt, {
                        type_value: mt,
                        description: m.metric_type?.description ?? '',
                    });
                }
            });

            // Commit UI state
            setBehaviors(behaviorsData);
            setBehaviorsWithMetrics(behaviorsData);
            setBehaviorMetrics(perBehavior);
            setMetrics(metricsData); // MetricDetail2[]

            setFilterOptions((prev) => ({
                ...prev,
                backend: Array.from(uniqueBackend.values()),
                type: Array.from(uniqueMetric.values()),
            }));

            setError(null);
        }
    }, [
        behaviorsQuery.isPending,
        metricsQuery.isPending,
        behaviorsQuery.isError,
        metricsQuery.isError,
        behaviorsQuery.error,
        metricsQuery.error,
        behaviorsQuery.isSuccess,
        metricsQuery.isSuccess,
        behaviorsQuery.data,
        metricsQuery.data,
        notifications,
    ]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        const params = new URLSearchParams(searchParams.toString());
        if (newValue === 1) params.set('tab', 'selected');
        else params.delete('tab');
        router.replace(`/metrics?${params.toString()}`, { scroll: false });
    };

    return (
        <ErrorBoundary>
            <Box sx={{ width: '100%', minHeight: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, bgcolor: 'background.paper' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="metrics tabs">
                        <Tab icon={<ViewQuiltIcon />} iconPosition="start" label="Metrics Directory" {...a11yProps(0)} />
                        <Tab icon={<ChecklistIcon />} iconPosition="start" label="Selected Metrics" {...a11yProps(1)} />
                    </Tabs>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <CustomTabPanel value={value} index={0}>
                        <MetricsDirectoryTab
                            organizationId={organizationId}
                            behaviors={behaviors}
                            metrics={metrics}
                            filters={filters}
                            filterOptions={filterOptions}
                            isLoading={isLoadingMetricsDirectory}
                            error={error}
                            setFilters={setFilters}
                            setMetrics={setMetrics}
                            setBehaviorMetrics={setBehaviorMetrics}
                            setBehaviorsWithMetrics={setBehaviorsWithMetrics}
                        />
                    </CustomTabPanel>

                    <CustomTabPanel value={value} index={1}>
                        <SelectedMetricsTab
                            organizationId={organizationId}
                            behaviorsWithMetrics={behaviorsWithMetrics}
                            behaviorMetrics={behaviorMetrics}
                            isLoading={isLoadingSelectedMetrics}
                            error={error}
                            setBehaviors={setBehaviors}
                            setBehaviorsWithMetrics={setBehaviorsWithMetrics}
                            setBehaviorMetrics={setBehaviorMetrics}
                            onTabChange={() => setValue(0)}
                        />
                    </CustomTabPanel>
                </Box>
            </Box>
        </ErrorBoundary>
    );
}
