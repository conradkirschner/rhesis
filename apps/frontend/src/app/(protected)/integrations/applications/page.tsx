import { dehydrate, QueryClient } from '@tanstack/react-query';
import { prefetchIntegrationsApplications } from '@/hooks/data';
import IntegrationsApplicationsContainer from './components/IntegrationsApplicationsContainer';
import HydrateClient from '@/components/providers/HydrateClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchIntegrationsApplications(queryClient);
  const state = dehydrate(queryClient);

  return (
    <HydrateClient state={state}>
      <IntegrationsApplicationsContainer />
    </HydrateClient>
  );
}