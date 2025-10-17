import { auth } from '@/auth';
import {dehydrate, QueryClient} from '@tanstack/react-query';
import { prefetchGenerateTests } from '@/hooks/data/GenerateTests/prefetchGenerateTests';
import GenerateTestsContainer from './components/GenerateTestsContainer';
import HydrateClient from '@/components/providers/HydrateClient';

export default async function GenerateTestsPage() {
  const session = await auth();
  if (!session?.session_token) {
    throw new Error('No session token available');
  }

  const queryClient = new QueryClient();
  await prefetchGenerateTests(queryClient);
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrateClient state={dehydratedState}>
      <GenerateTestsContainer />
    </HydrateClient>
  );
}