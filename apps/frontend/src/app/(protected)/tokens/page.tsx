import { auth } from '@/auth';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchTokens } from '@/hooks/data';

import TokensContainer from './components/TokensContainer';

export default async function TokensPage() {
  const session = await auth();
  if (!session?.session_token) {
    throw new Error('No session token available');
  }

  const qc = new QueryClient();

  await prefetchTokens(qc, {
    skip: 0,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const state = dehydrate(qc);

  return (
    <HydrationBoundary state={state}>
      <TokensContainer />
    </HydrationBoundary>
  );
}