'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsData } from '@/hooks/data/Projects/useProjectsData';
import FeaturePageFrame from '../ui/FeaturePageFrame';
import InlineLoader from '../ui/InlineLoader';
import ErrorBanner from '../ui/ErrorBanner';
import StepProjectsGrid from '../ui/steps/StepProjectsGrid';
import type { UiProject, UiProjectsGridProps } from '../ui/types';

type Props = {
  readonly sessionToken: string;
  readonly baseUrl?: string;
};

export default function ProjectsContainer({ sessionToken, baseUrl }: Props) {
  const router = useRouter();

  const { projects, isLoading, isError, errorMessage, refetch } = useProjectsData({
    sessionToken,
    baseUrl,
  });

  const onCreate = useCallback(() => {
    router.push('/projects/create-new');
  }, [router]);

  const handleView = useCallback<UiProjectsGridProps['onView']>(
    (id) => {
      router.push(`/projects/${id}`);
    },
    [router],
  );

  const uiProjects: readonly UiProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isActive: p.isActive ?? false,
    icon: p.icon ?? undefined,
    createdAt: p.createdAt ?? undefined,
    owner: p.owner
      ? {
          name: p.owner.name ?? undefined,
          email: p.owner.email ?? undefined,
          picture: p.owner.picture ?? undefined,
        }
      : undefined,
  })) satisfies readonly UiProject[];

  return (
    <FeaturePageFrame title="Projects" onCreate={onCreate}>
      {isLoading ? (
        <InlineLoader />
      ) : isError ? (
        <ErrorBanner message={errorMessage ?? 'Failed to load projects.'} onRetry={refetch} />
      ) : (
        <StepProjectsGrid projects={uiProjects} onView={handleView} />
      )}
    </FeaturePageFrame>
  );
}