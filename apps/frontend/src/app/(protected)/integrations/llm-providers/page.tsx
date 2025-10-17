import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { prefetchLlmProviders } from '@/hooks/data';

import LlmProvidersContainer from './components/LlmProvidersContainer';

export const dynamic = 'force-dynamic';


export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchLlmProviders(queryClient);
  const state = dehydrate(queryClient);

  return (
    <HydrationBoundary state={state}>
      <LlmProvidersContainer />
    </HydrationBoundary>
  );
}