import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// SDK types are used only inside this hook.
import type { ProjectDetail, ProjectUpdate } from '@/api-client/types.gen';
import {
  readProjectProjectsProjectIdGetOptions,
  updateProjectProjectsProjectIdPutMutation,
  deleteProjectProjectsProjectIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

export interface UseProjectDataParams {
  readonly projectId: string;
  readonly sessionToken: string;
  readonly baseUrl?: string;
}

export interface ProjectOwner {
  readonly id: string;
  readonly name?: string | null;
  readonly email?: string | null;
  readonly picture?: string | null;
}

export interface ProjectData {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly ownerId: string;
  readonly owner?: ProjectOwner | null;
  readonly icon?: string | null;
  readonly isActive: boolean;
}

export interface UseProjectData {
  readonly project: ProjectData | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage: string | null;
  readonly refetch: () => void;

  readonly isUpdating: boolean;
  readonly isDeleting: boolean;

  readonly updateProject: (update: Partial<ProjectUpdate>) => Promise<ProjectData>;
  readonly deleteProject: () => Promise<void>;
}

function mapToProjectData(api: ProjectDetail): ProjectData {
  return {
    id: api.id,
    name: api.name ?? '',
    description: api.description ?? null,
    ownerId: api.owner_id ?? api.owner?.id ?? '',
    owner: api.owner
      ? {
          id: api.owner.id,
          name: api.owner.name ?? null,
          email: api.owner.email ?? null,
          picture: api.owner.picture ?? null,
        }
      : null,
    icon: api.icon ?? null,
    isActive: Boolean(api.is_active),
  };
}

export function useProjectData(params: UseProjectDataParams): UseProjectData {
  const { projectId, sessionToken, baseUrl = process.env.BACKEND_URL } = params;

  const queryOptions = useMemo(
    () =>
      readProjectProjectsProjectIdGetOptions({
        path: { project_id: projectId },
        baseUrl,
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    [projectId, baseUrl, sessionToken],
  );

  const qc = useQueryClient();

  const { data, isPending, isError, error, refetch } = useQuery({
    ...queryOptions,
    staleTime: 60_000,
    select: (api: ProjectDetail) => mapToProjectData(api),
  });

  const updateMutation = useMutation(
    updateProjectProjectsProjectIdPutMutation({
      baseUrl,
      headers: { Authorization: `Bearer ${sessionToken}` },
    }),
  );

  const deleteMutation = useMutation(
    deleteProjectProjectsProjectIdDeleteMutation({
      baseUrl,
      headers: { Authorization: `Bearer ${sessionToken}` },
    }),
  );

  return {
    project: data ?? null,
    isLoading: isPending,
    isError,
    errorMessage: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: () => {
      void refetch();
    },

    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    updateProject: async (update: Partial<ProjectUpdate>) => {
      const updated = (await updateMutation.mutateAsync({
        path: { project_id: projectId },
        body: update,
      })) as ProjectDetail;

      // Keep cache in sync using the generated query key.
      qc.setQueryData(queryOptions.queryKey, updated);

      return mapToProjectData(updated);
    },

    deleteProject: async () => {
      await deleteMutation.mutateAsync({ path: { project_id: projectId } });
      // Invalidate only this project's cache.
      qc.invalidateQueries({ queryKey: queryOptions.queryKey });
    },
  };
}