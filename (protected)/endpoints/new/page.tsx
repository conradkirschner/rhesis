import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchEndpoints } from '@/src/hooks/data';
import EndpointsContainer from './components/EndpointsContainer';

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchEndpoints(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* Client container */}
      <EndpointsContainer />
    </HydrationBoundary>
  );
}