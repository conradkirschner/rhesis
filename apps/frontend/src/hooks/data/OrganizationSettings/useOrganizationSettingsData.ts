import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  readOrganizationOrganizationsOrganizationIdGetOptions,
  readOrganizationOrganizationsOrganizationIdGetQueryKey,
  updateOrganizationOrganizationsOrganizationIdPutMutation,
  leaveOrganizationUsersLeaveOrganizationPatchMutation,
} from '@/api-client/@tanstack/react-query.gen';

type OrganizationRecord = {
  id: string;
  name: string;
  display_name?: string | null;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  domain?: string | null;
  is_domain_verified?: boolean | null;
  is_active: boolean;
  max_users?: number | null;
  subscription_ends_at?: string | null;
  created_at?: string | null;
};

type UpdatePayload = Partial<
  Pick<
    OrganizationRecord,
    | 'name'
    | 'display_name'
    | 'description'
    | 'website'
    | 'logo_url'
    | 'email'
    | 'phone'
    | 'address'
    | 'domain'
  >
>;

export function useOrganizationSettingsData(organizationId: string) {
  const enabled = Boolean(organizationId);
  const queryClient = useQueryClient();

  const queryKey = readOrganizationOrganizationsOrganizationIdGetQueryKey({
    path: { organization_id: organizationId },
  });

  const orgQuery = useQuery({
    ...readOrganizationOrganizationsOrganizationIdGetOptions({
      path: { organization_id: organizationId },
    }),
    enabled,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    ...updateOrganizationOrganizationsOrganizationIdPutMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const leaveMutation = useMutation({
    ...leaveOrganizationUsersLeaveOrganizationPatchMutation(),
  });

  const organization = useMemo<OrganizationRecord | null>(() => {
    const data = orgQuery.data as OrganizationRecord | undefined;
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      display_name: data.display_name ?? null,
      description: data.description ?? null,
      website: data.website ?? null,
      logo_url: data.logo_url ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      domain: data.domain ?? null,
      is_domain_verified: Boolean(data.is_domain_verified),
      is_active: Boolean(data.is_active),
      max_users: data.max_users ?? null,
      subscription_ends_at: data.subscription_ends_at ?? null,
      created_at: data.created_at ?? null,
    };
  }, [orgQuery.data]);

  const updateOrganization = (payload: UpdatePayload) =>
    updateMutation.mutateAsync({
      path: { organization_id: organizationId },
      body: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.display_name !== undefined
          ? { display_name: payload.display_name || undefined }
          : {}),
        ...(payload.description !== undefined
          ? { description: payload.description || undefined }
          : {}),
        ...(payload.website !== undefined
          ? { website: payload.website || undefined }
          : {}),
        ...(payload.logo_url !== undefined
          ? { logo_url: payload.logo_url || undefined }
          : {}),
        ...(payload.email !== undefined
          ? { email: payload.email || undefined }
          : {}),
        ...(payload.phone !== undefined
          ? { phone: payload.phone || undefined }
          : {}),
        ...(payload.address !== undefined
          ? { address: payload.address || undefined }
          : {}),
        ...(payload.domain !== undefined
          ? { domain: payload.domain || undefined }
          : {}),
      },
    });

  const leaveOrganization = () => leaveMutation.mutateAsync({});

  return {
    organization,
    isLoading: orgQuery.isLoading,
    isError: orgQuery.isError,
    errorMessage: (orgQuery.error as Error | null)?.message ?? null,
    refetch: orgQuery.refetch,
    updateOrganization,
    isUpdating: updateMutation.isPending,
    leaveOrganization,
    isLeaving: leaveMutation.isPending,
  };
}