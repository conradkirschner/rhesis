import { auth } from '@/auth';
import { HydrateClient, makeQueryClient } from '@/lib/react-query';
import { dehydrate } from '@tanstack/react-query';
import { prefetchGenerateTests } from '@/src/hooks/data/GenerateTests/prefetchGenerateTests';
import GenerateTestsContainer from './components/GenerateTestsContainer';

export default async function GenerateTestsPage() {
  const session = await auth();
  if (!session?.session_token) {
    throw new Error('No session token available');
  }

  const queryClient = makeQueryClient();
  await prefetchGenerateTests(queryClient);
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrateClient state={dehydratedState}>
      <GenerateTestsContainer />
    </HydrateClient>
  );
}