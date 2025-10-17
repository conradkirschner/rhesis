'use client';

import { useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEndpointsData } from '@/hooks/data';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import StepperHeader from '../ui/StepperHeader';
import ActionBar from '../ui/ActionBar';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepEndpointsTable from '../ui/steps/StepEndpointsTable';
import type {
  UiEndpointRow,
  UiPaginationModel,
  UiProjectIconName,
} from '../ui/types';

const DEFAULT_PAGINATION: UiPaginationModel = { page: 0, pageSize: 10 } as const;

export default function EndpointsContainer() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [pagination, setPagination] = useState<UiPaginationModel>(DEFAULT_PAGINATION);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { endpoints, totalCount, projectsById, isLoading, error, deleteEndpoints } =
    useEndpointsData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      enabled: status !== 'loading' && !!session?.session_token,
    });

  const rows = useMemo(() => {
    const toIcon = (raw?: string | null): UiProjectIconName => {
      const allowed: readonly UiProjectIconName[] = [
        'SmartToy',
        'Devices',
        'Web',
        'Storage',
        'Code',
        'DataObject',
        'Cloud',
        'Analytics',
        'ShoppingCart',
        'Terminal',
        'VideogameAsset',
        'Chat',
        'Psychology',
        'Dashboard',
        'Search',
        'AutoFixHigh',
        'PhoneIphone',
        'School',
        'Science',
        'AccountTree',
      ] as const;
      return allowed.includes(raw as UiProjectIconName) ? (raw as UiProjectIconName) : 'SmartToy';
    };

    const shaped = endpoints.map((e) => {
      const project = e.project_id ? projectsById[e.project_id] : undefined;
      return {
        id: e.id,
        name: e.name,
        protocol: e.protocol,
        environment: e.environment,
        projectLabel: project ? project.name : 'No project',
        projectIconName: toIcon(project?.icon ?? undefined),
      };
    });

    return shaped satisfies readonly UiEndpointRow[];
  }, [endpoints, projectsById]);

  const handlePaginationChange = useCallback((model: UiPaginationModel) => {
    setPagination(model);
  }, []);

  const handleSelectionChange = useCallback((ids: readonly string[]) => {
    setSelected(ids);
  }, []);

  const handleDelete = useCallback(async () => {
    if (selected.length === 0) return;
    await deleteEndpoints(selected);
    setSelected([]);
    setConfirmOpen(false);
  }, [deleteEndpoints, selected]);

  const onNewEndpoint = useCallback(() => {
    router.push('/endpoints/new');
  }, [router]);

  const onImportSwagger = useCallback(() => {
    router.push('/endpoints/swagger');
  }, [router]);

  if (status === 'loading') {
    return (
      <FeaturePageFrame title="Endpoints" breadcrumbs={[{ title: 'Endpoints' }]}>
        <InlineLoader label="Loading session…" />
      </FeaturePageFrame>
    );
  }

  if (!session?.session_token) {
    return (
      <FeaturePageFrame title="Endpoints" breadcrumbs={[{ title: 'Endpoints' }]}>
        <ErrorBanner message="Authentication required. Please log in." />
      </FeaturePageFrame>
    );
  }

  if (error) {
    return (
      <FeaturePageFrame title="Endpoints" breadcrumbs={[{ title: 'Endpoints' }]}>
        <ErrorBanner message={`Error loading endpoints: ${error}`} />
      </FeaturePageFrame>
    );
  }

  return (
    <FeaturePageFrame title="Endpoints" breadcrumbs={[{ title: 'Endpoints' }]}>
      <StepperHeader title="Endpoints" subtitle={`${totalCount} total`} />
      <ActionBar
        canDelete={selected.length > 0}
        deleteCount={selected.length}
        onOpenConfirm={() => setConfirmOpen(true)}
        onCloseConfirm={() => setConfirmOpen(false)}
        confirmOpen={confirmOpen}
        onConfirmDelete={handleDelete}
        onNew={onNewEndpoint}
        onImport={onImportSwagger}
      />
      <StepEndpointsTable
        rows={rows}
        loading={isLoading}
        totalCount={totalCount}
        paginationModel={pagination}
        onPaginationModelChange={handlePaginationChange}
        selectedRowIds={selected}
        onSelectionChange={handleSelectionChange}
      />
    </FeaturePageFrame>
  );
}