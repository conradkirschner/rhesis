import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchDemo } from '@/hooks/data';
import DemoContainer from './components/DemoContainer';

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchDemo(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DemoContainer />
    </HydrationBoundary>
  );
}