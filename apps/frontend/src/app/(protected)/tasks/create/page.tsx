import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchTaskCreate } from '@/hooks/data';

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchTaskCreate(queryClient);
  const state = dehydrate(queryClient);

  return (
    <HydrationBoundary state={state}>
      <TaskCreateContainer />
    </HydrationBoundary>
  );
}

// Lazy import to keep this file server-only (no MUI here).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TaskCreateContainer } = require('./components/TaskCreateContainer');