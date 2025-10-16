import { dehydrate, QueryClient } from '@tanstack/react-query';
import { prefetchIntegrationsApplications } from '@/hooks/data';
import HydrateClient from '@/lib/react-query/HydrateClient';
import IntegrationsApplicationsContainer from './components/IntegrationsApplicationsContainer';

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