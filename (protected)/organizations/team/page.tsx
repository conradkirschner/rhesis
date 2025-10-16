import { QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchTeam } from '@/hooks/data/Team/prefetchTeam';
import HydrateClient from '@/components/common/HydrateClient';
import TeamContainer from './components/TeamContainer';

export default async function TeamPage() {
  const queryClient = new QueryClient();
  await prefetchTeam(queryClient, { skip: 0, limit: 25 });
  const state = dehydrate(queryClient);

  return (
    <HydrateClient state={state}>
      <TeamContainer />
    </HydrateClient>
  );
}