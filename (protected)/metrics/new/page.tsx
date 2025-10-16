import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchMetrics } from '@/src/hooks/data';
import MetricsContainer from './components/MetricsContainer';

export default async function Page() {
  const qc = new QueryClient();
  await prefetchMetrics(qc);
  const state = dehydrate(qc);

  return (
    <HydrationBoundary state={state}>
      <MetricsContainer />
    </HydrationBoundary>
  );
}