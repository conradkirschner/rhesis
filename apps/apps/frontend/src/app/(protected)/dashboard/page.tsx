import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { prefetchDashboard } from '../../../hooks/data/Dashboard/prefetchDashboard';
import DashboardContainer from './components/DashboardContainer';

export default async function Page() {
  const queryClient = new QueryClient();

  await prefetchDashboard(queryClient, {
    months: 6,
    top: 5,
    recentCreated: { skip: 0, limit: 10 },
    recentUpdated: { skip: 0, limit: 10 },
    testSets: { skip: 0, limit: 10 },
  });

  const state = dehydrate(queryClient);

  return (
    <HydrationBoundary state={state}>
      <DashboardContainer />
    </HydrationBoundary>
  );
}