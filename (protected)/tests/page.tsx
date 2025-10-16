import { dehydrate, QueryClient } from '@tanstack/react-query';
import { prefetchTests } from '@/hooks/data/Tests/prefetchTests';
import HydrateClient from '@/components/providers/HydrateClient';
import TestsContainer from './components/TestsContainer';

export default async function Page() {
  const qc = new QueryClient();
  await prefetchTests(qc, { skip: 0, limit: 25, sort_by: 'created_at', sort_order: 'desc' });
  const state = dehydrate(qc);

  return (
    <HydrateClient state={state}>
      <TestsContainer />
    </HydrateClient>
  );
}