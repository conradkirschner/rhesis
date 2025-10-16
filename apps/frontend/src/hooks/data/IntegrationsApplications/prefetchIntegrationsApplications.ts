import type { QueryClient } from '@tanstack/react-query';
import { integrationsApplicationsOptions } from './useIntegrationsApplicationsData';

export async function prefetchIntegrationsApplications(queryClient: QueryClient) {
  await queryClient.ensureQueryData(integrationsApplicationsOptions);
}