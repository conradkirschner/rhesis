import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { prefetchTestRuns } from '@/src/hooks/data/TestRuns/prefetchTestRuns';
import TestRunsContainer from './components/TestRunsContainer';

export default async function Page() {
  const qc = new QueryClient();
  await prefetchTestRuns(qc, { page: 0, pageSize: 50 });
  const state = dehydrate(qc);

  return (
    <HydrationBoundary state={state}>
      <TestRunsContainer />
    </HydrationBoundary>
  );
}