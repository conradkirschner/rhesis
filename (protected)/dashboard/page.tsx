import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchDashboard } from '@/hooks/data';

import DashboardContainer from './components/DashboardContainer';

export default async function DashboardPage() {
  const queryClient = new QueryClient();
  await prefetchDashboard(queryClient, { pageSize: 10 });
  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardContainer />
    </HydrationBoundary>
  );
}