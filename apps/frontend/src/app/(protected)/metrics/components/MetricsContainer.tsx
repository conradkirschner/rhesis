'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMetricsData } from '@/hooks/data';
import { useNotifications } from '@/components/common/NotificationContext';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import type {
  UiBehaviorRef,
  UiBehaviorSection,
  UiFilterState,
  UiFilterOptions,
  UiMetricItem,
} from '../ui/types';
import StepDirectory from '../ui/steps/StepDirectory';
import StepSelected from '../ui/steps/StepSelected';

export default function MetricsContainer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const notifications = useNotifications();

  const organizationId = session?.user?.organization_id ?? '';
  // FIX: all are undefined - fix them behaviors, metrics, filterOptions, isLoading, error, mutations
  const { behaviors, metrics, filterOptions, isLoading, error, mutations } = useMetricsData();

  const [tab, setTab] = useState(() => (searchParams.get('tab') === 'selected' ? 1 : 0));
  useEffect(() => {
    setTab(searchParams.get('tab') === 'selected' ? 1 : 0);
  }, [searchParams]);
  const onChangeTab = (_: unknown, index: number) => {
    setTab(index);
    const params = new URLSearchParams(searchParams.toString());
    if (index === 1) params.set('tab', 'selected');
    else params.delete('tab');
    router.replace(`/metrics?${params.toString()}`, { scroll: false });
  };

  const [filters, setFilters] = useState<UiFilterState>({
    search: '',
    backend: [],
    type: [],
    scoreType: [],
  });

  const uiFilterOptions: UiFilterOptions = useMemo(
    () => ({
      backend: filterOptions.backend,
      type: filterOptions.type.map((t) => ({ value: t.value, description: t.description })),
      scoreType: filterOptions.scoreType,
    }),
    [filterOptions],
  );

  const behaviorById = useMemo(() => {
    const map = new Map(behaviors.map((b) => [b.id, b]));
    return map;
  }, [behaviors]);

  const behaviorRefs: readonly UiBehaviorRef[] = useMemo(
    () =>
      behaviors
        .filter((b) => (b.name ?? '').trim() !== '')
        .map((b) => ({ id: b.id, name: b.name })) as readonly UiBehaviorRef[],
    [behaviors],
  );

  const uiMetrics: readonly UiMetricItem[] = useMemo(() => {
    return metrics.map((m) => {
      const usedIn = m.behaviorIds
        .map((bid) => behaviorById.get(bid)?.name ?? '')
        .filter((n) => n.trim() !== '');
      const type =
        m.metricType === 'custom-prompt' ||
        m.metricType === 'api-call' ||
        m.metricType === 'custom-code' ||
        m.metricType === 'grading'
          ? m.metricType
          : undefined;
      return {
        id: m.id,
        title: m.name,
        description: m.description ?? '',
        backend: m.backend ?? undefined,
        metricType: m.metricType ?? undefined,
        scoreType: m.scoreType ?? undefined,
        usedIn,
        type,
      } satisfies UiMetricItem;
    });
  }, [metrics, behaviorById]);

  const filteredDirectoryItems = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return uiMetrics.filter((m) => {
      const searchMatch =
        q === '' ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q) ||
        (m.metricType ?? '').toLowerCase().includes(q);

      const backendMatch =
        filters.backend.length === 0 ||
        (m.backend && filters.backend.includes(m.backend.toLowerCase()));

      const typeMatch =
        filters.type.length === 0 ||
        (m.metricType && filters.type.includes(m.metricType));

      const scoreTypeMatch =
        filters.scoreType.length === 0 ||
        (m.scoreType && filters.scoreType.includes(m.scoreType));

      return searchMatch && backendMatch && typeMatch && scoreTypeMatch;
    });
  }, [uiMetrics, filters]);

  const sections: readonly UiBehaviorSection[] = useMemo(() => {
    return behaviors
      .filter((b) => (b.name ?? '').trim() !== '')
      .map((b) => {
        const sectionMetrics = uiMetrics.filter((m) =>
          metrics.find((x) => x.id === m.id)?.behaviorIds.includes(b.id),
        );
        return {
          id: b.id,
          name: b.name,
          description: b.description,
          metrics: sectionMetrics,
        } satisfies UiBehaviorSection;
      });
  }, [behaviors, uiMetrics, metrics]);

  const onOpenMetricDetail = (metricId: string) => {
    router.push(`/metrics/${metricId}`);
  };

  const onCreateMetric = (typeSlug: string) => {
    router.push(`/metrics/new?type=${encodeURIComponent(typeSlug)}`);
  };

  const onAssignMetric = async (metricId: string, behaviorId: string) => {
    try {
      await mutations.assignMetricToBehavior(behaviorId, metricId);
      notifications.show('Successfully assigned metric to behavior', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch (e) {
      notifications.show((e as Error)?.message ?? 'Failed to assign metric', {
        severity: 'error',
        autoHideDuration: 4000,
      });
    }
  };

  const onRemoveFromBehavior = async (behaviorId: string, metricId: string) => {
    try {
      await mutations.removeMetricFromBehavior(behaviorId, metricId);
      notifications.show('Successfully removed metric from behavior', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch (e) {
      notifications.show((e as Error)?.message ?? 'Failed to remove metric', {
        severity: 'error',
        autoHideDuration: 4000,
      });
    }
  };

  const onCreateSection = async (name: string, description: string | null) => {
    try {
      await mutations.createBehavior(name, description, organizationId);
      notifications.show('Dimension created successfully', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch (e) {
      notifications.show((e as Error)?.message ?? 'Failed to create dimension', {
        severity: 'error',
        autoHideDuration: 4000,
      });
    }
  };

  const onUpdateSection = async (behaviorId: string, name: string, description: string | null) => {
    try {
      await mutations.updateBehavior(behaviorId, name, description, organizationId);
      notifications.show('Dimension updated successfully', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch (e) {
      notifications.show((e as Error)?.message ?? 'Failed to update dimension', {
        severity: 'error',
        autoHideDuration: 4000,
      });
    }
  };

  const onDeleteSection = async (behaviorId: string) => {
    try {
      await mutations.deleteBehavior(behaviorId);
      notifications.show('Dimension deleted successfully', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch (e) {
      notifications.show((e as Error)?.message ?? 'Failed to delete dimension', {
        severity: 'error',
        autoHideDuration: 4000,
      });
    }
  };

  const onDeleteMetric = async (metricId: string) => {
    try {
      await mutations.deleteMetric(metricId);
      notifications.show('Metric deleted successfully', {
        severity: 'success',
        autoHideDuration: 4000,
      });
    } catch (e) {
      notifications.show((e as Error)?.message ?? 'Failed to delete metric', {
        severity: 'error',
        autoHideDuration: 4000,
      });
    }
  };

  if (status === 'loading') {
    return (
      <FeaturePageFrame title="Metrics" tabIndex={tab} onTabChange={onChangeTab}>
        <InlineLoader message="Loading session..." />
      </FeaturePageFrame>
    );
  }

  if (!session?.session_token) {
    return (
      <FeaturePageFrame title="Metrics" tabIndex={tab} onTabChange={onChangeTab}>
        <ErrorBanner message="Authentication required. Please log in." />
      </FeaturePageFrame>
    );
  }

  if (!organizationId) {
    return (
      <FeaturePageFrame title="Metrics" tabIndex={tab} onTabChange={onChangeTab}>
        <ErrorBanner message="Organisation is required" />
      </FeaturePageFrame>
    );
  }

  if (isLoading) {
    return (
      <FeaturePageFrame title="Metrics" tabIndex={tab} onTabChange={onChangeTab}>
        <InlineLoader message="Loading metrics..." />
      </FeaturePageFrame>
    );
  }

  if (error) {
    return (
      <FeaturePageFrame title="Metrics" tabIndex={tab} onTabChange={onChangeTab}>
        <ErrorBanner message={error} />
      </FeaturePageFrame>
    );
  }
  const directoryProps = {
    items: filteredDirectoryItems,
    behaviors: behaviorRefs,
    filters,
    filterOptions: uiFilterOptions,
    isLoading: false,
    error: null as string | null,
    onFiltersChange: setFilters,
    onOpenMetricDetail,
    onAssignMetric,
    onDeleteMetric,
    onCreateMetric,
  };

  return (
      <FeaturePageFrame title="Metrics" tabIndex={tab} onTabChange={onChangeTab}>
        {tab === 0 ? (
            <StepDirectory {...(directoryProps as any)} />
        ) : (
            <StepSelected
                sections={sections}
                organizationId={organizationId}
                onOpenMetricDetail={onOpenMetricDetail}
                onRemoveMetric={onRemoveFromBehavior}
                onCreateSection={onCreateSection}
                onUpdateSection={onUpdateSection}
                onDeleteSection={onDeleteSection}
            />
        )}
      </FeaturePageFrame>
  );
}