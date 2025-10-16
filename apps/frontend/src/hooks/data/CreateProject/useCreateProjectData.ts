import { useMutation, useQuery, type QueryKey } from '@tanstack/react-query';
import {
  createProjectProjectsPostMutation,
  readUserUsersUserIdGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

type OwnerSummary = Readonly<{
  id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}>;

type CreateProjectInput = Readonly<{
  name: string;
  description: string;
  icon: string;
  ownerId: string;
  userId: string;
  organizationId: string;
}>;

type UseCreateProjectDataArgs = Readonly<{
  ownerId?: string;
}>;

export function useCreateProjectData(args: UseCreateProjectDataArgs) {
  const ownerQuery = useQuery({
    ...readUserUsersUserIdGetOptions({
      path: { user_id: String(args.ownerId ?? '') },
    }),
    enabled: Boolean(args.ownerId),
    staleTime: 60_000,
  });

  const createProject = useMutation({
    ...createProjectProjectsPostMutation(),
  });

  const owner: OwnerSummary | undefined = ownerQuery.data
    ? {
        id: String(args.ownerId),
        name: ownerQuery.data.name ?? null,
        email: ownerQuery.data.email ?? null,
        picture: ownerQuery.data.picture ?? null,
      }
    : undefined;

  return {
    owner,
    isOwnerLoading: ownerQuery.isLoading,
    createProject: async (input: CreateProjectInput) => {
      await createProject.mutateAsync({
        body: {
          name: input.name,
          description: input.description,
          icon: input.icon,
          user_id: input.userId,
          owner_id: input.ownerId,
          organization_id: input.organizationId,
          is_active: true,
        },
      });
    },
    isCreating: createProject.isPending,
  };
}

export type { OwnerSummary, CreateProjectInput };