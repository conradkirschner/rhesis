import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { prefetchEndpoints } from '@/hooks/data';
import EndpointsContainer from './components/EndpointsContainer';

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchEndpoints(queryClient, { page: 0, pageSize: 10 });
  const state = dehydrate(queryClient);

  return (
    <HydrationBoundary state={state}>
      <EndpointsContainer />
    </HydrationBoundary>
  );
}