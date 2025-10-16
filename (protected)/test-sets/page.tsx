import { auth } from '@/auth';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { prefetchTestSets } from '@/hooks/data';
import TestSetsContainer from './components/TestSetsContainer';

function getBackendUrl() {
  return process.env.BACKEND_URL;
}

export default async function Page() {
  const session = await auth();
  const token = session?.session_token;
  if (!token) {
    throw new Error('No session token available');
  }

  const qc = new QueryClient();
  await prefetchTestSets(qc, { token, baseUrl: getBackendUrl() });
  const state = dehydrate(qc);

  return (
    <HydrationBoundary state={state}>
      <TestSetsContainer />
    </HydrationBoundary>
  );
}