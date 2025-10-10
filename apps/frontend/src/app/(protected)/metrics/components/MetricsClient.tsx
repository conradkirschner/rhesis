'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';

/** Hey API client + React Query helpers (generated) */
import { client } from '@/api-client/client.gen';
import {
  readBehaviorsBehaviorsGetOptions,
  readMetricsMetricsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import type { Behavior, Metric, TypeLookup } from '@/api-client/types.gen';

import SelectedMetricsTab from './SelectedMetricsTab';
import MetricsDirectoryTab from './MetricsDirectoryTab';
import type { UUID } from 'crypto';

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

/** Derived map for Selected tab */
interface BehaviorMetrics {
  [behaviorId: string]: {
    metrics: Metric[];
    isLoading: boolean;
    error: string | null;
  };
}

interface MetricsClientProps {
  sessionToken: string;
  organizationId: UUID;
}

/** Helpers to normalize API results without casts */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function extractArray<T>(x: { data?: unknown } | unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (isObject(x) && Array.isArray(x.data)) return x.data as T[];
  return [];
}
function hasMetricsField(
    b: unknown
): b is Behavior & { metrics?: Array<Pick<Metric, 'id'>> } {
  return isObject(b) && 'metrics' in b;
}

export default function MetricsClientComponent({
                                                 sessionToken,
                                                 organizationId,
                                               }: MetricsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  // init tab from URL
  const initialTab = React.useMemo(() => {
    const tab = searchParams.get('tab');
    return tab === 'selected' ? 1 : 0;
  }, [searchParams]);
  const [value, setValue] = React.useState(initialTab);

  // UI state (keep shapes used by child components)
  const [behaviors, setBehaviors] = React.useState<Behavior[]>([]);
  const [behaviorsWithMetrics, setBehaviorsWithMetrics] = React.useState<
      (Behavior & { metrics?: Array<Pick<Metric, 'id'>> })[]
  >([]);
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [isLoadingSelectedMetrics, setIsLoadingSelectedMetrics] =
      React.useState(true);
  const [isLoadingMetricsDirectory, setIsLoadingMetricsDirectory] =
      React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<FilterState>(initialFilterState);
  const [filterOptions, setFilterOptions] =
      React.useState<FilterOptions>(initialFilterOptions);
  const [behaviorMetrics, setBehaviorMetrics] = React.useState<BehaviorMetrics>(
      {}
  );

  /** Inject bearer token into Hey API client */
  React.useEffect(() => {
    const headers = new Headers();
    if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
    client.setConfig({ headers });
    // Token change => invalidate generated keys (don't mutate queryKey)
    queryClient.invalidateQueries({ queryKey: readBehaviorsBehaviorsGetOptions({}).queryKey });
    queryClient.invalidateQueries({ queryKey: readMetricsMetricsGetOptions({}).queryKey });
  }, [sessionToken, queryClient]);

  /** Generated options (no queryKey tampering) */
  const behaviorsOpts = readBehaviorsBehaviorsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
  });
  const metricsOpts = readMetricsMetricsGetOptions({
    query: { skip: 0, limit: 100, sort_by: 'created_at', sort_order: 'desc' },
  });

  /** Queries */
  const behaviorsQuery = useQuery({
    ...behaviorsOpts,
    enabled: !!sessionToken,
    staleTime: 60_000,
    select: (data) => {
      const arr = extractArray<unknown>(data);
      // Keep only items that look like Behavior (structural) and include optional metrics
      const maybe = arr.filter(isObject) as Behavior[];
      return maybe as Array<Behavior & { metrics?: Array<Pick<Metric, 'id'>> }>;
    },
  });

  const metricsQuery = useQuery({
    ...metricsOpts,
    enabled: !!sessionToken,
    staleTime: 60_000,
    select: (data) => extractArray<Metric>(data),
  });

  /** Build derived state on query changes */
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
      const behaviorsWithMetricsData = behaviorsQuery.data ?? [];
      const metricsData = metricsQuery.data ?? [];

      // Add behavior IDs onto each metric for compatibility with UI
      const metricsWithBehaviors: Metric[] = metricsData.map((m) => {
        const bIds = behaviorsWithMetricsData
            .filter((b) => hasMetricsField(b) && (b.metrics ?? []).some((bm) => bm.id === m.id))
            .map((b) => b.id ?? '')
            .filter((id): id is string => !!id);
        // augment structurally; TS keeps Metric props and ignores extra field in consumers that expect it
        return { ...m, behaviors: bIds } as Metric & { behaviors: string[] };
      });

      setBehaviorsWithMetrics(behaviorsWithMetricsData);
      setBehaviors(behaviorsWithMetricsData as Behavior[]);
      setMetrics(metricsWithBehaviors);

      // Initialize per-behavior metrics cache
      const init: BehaviorMetrics = {};
      behaviorsWithMetricsData.forEach((b) => {
        init[b.id ?? ''] = {
          metrics: (hasMetricsField(b) ? (b.metrics ?? []) : []) as Metric[],
          isLoading: false,
          error: null,
        };
      });
      setBehaviorMetrics(init);

      // Build filter options from metrics
      const uniqueBackend = new Map<string, { type_value: string }>();
      const uniqueMetric = new Map<string, { type_value: string; description: string }>();

      metricsWithBehaviors.forEach((metric) => {
        const btVal = (metric as { backend_type?: TypeLookup }).backend_type?.type_value ?? null;
        if (btVal) {
          const pretty = btVal.charAt(0).toUpperCase() + btVal.slice(1);
          uniqueBackend.set(btVal, { type_value: pretty });
        }
        const mt = (metric as { metric_type?: TypeLookup }).metric_type;
        if (mt?.type_value) {
          uniqueMetric.set(mt.type_value, {
            type_value: mt.type_value,
            description: mt.description ?? '',
          });
        }
      });

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

  /** Manual refresh via invalidation, keeping generated keys intact */
  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: behaviorsOpts.queryKey });
    queryClient.invalidateQueries({ queryKey: metricsOpts.queryKey });
  }, [queryClient, behaviorsOpts.queryKey, metricsOpts.queryKey]);

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
                  sessionToken={sessionToken}
                  organizationId={organizationId}
                  behaviors={behaviors}
                  metrics={metrics}
                  filters={filters}
                  filterOptions={filterOptions}
                  isLoading={isLoadingMetricsDirectory}
                  error={error}
                  onRefresh={handleRefresh}
                  setFilters={setFilters}
                  setMetrics={setMetrics}
                  setBehaviorMetrics={setBehaviorMetrics}
                  setBehaviorsWithMetrics={setBehaviorsWithMetrics}
                  onTabChange={() => setValue(1)}
              />
            </CustomTabPanel>

            <CustomTabPanel value={value} index={1}>
              <SelectedMetricsTab
                  sessionToken={sessionToken}
                  organizationId={organizationId}
                  behaviorsWithMetrics={behaviorsWithMetrics}
                  behaviorMetrics={behaviorMetrics}
                  isLoading={isLoadingSelectedMetrics}
                  error={error}
                  onRefresh={handleRefresh}
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
