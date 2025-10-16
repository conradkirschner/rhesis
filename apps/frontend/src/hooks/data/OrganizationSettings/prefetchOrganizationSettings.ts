import { QueryClient } from '@tanstack/react-query';
import { readOrganizationOrganizationsOrganizationIdGetOptions } from '@/api-client/@tanstack/react-query.gen';

export async function prefetchOrganizationSettings(
  queryClient: QueryClient,
  organizationId: string,
) {
  if (!organizationId) return;
  await queryClient.prefetchQuery({
    ...readOrganizationOrganizationsOrganizationIdGetOptions({
      path: { organization_id: organizationId },
    }),
    staleTime: 60_000,
  });
}