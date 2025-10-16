import { HydrationBoundary, dehydrate, QueryClient } from '@tanstack/react-query';
import { prefetchSwaggerEndpoint } from '@/hooks/data';
import SwaggerEndpointContainer from './components/SwaggerEndpointContainer';

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchSwaggerEndpoint(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SwaggerEndpointContainer />
    </HydrationBoundary>
  );
}