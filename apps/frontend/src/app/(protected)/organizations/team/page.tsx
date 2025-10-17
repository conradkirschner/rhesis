import { QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchTeam } from '@/hooks/data/Team/prefetchTeam';
import TeamContainer from './components/TeamContainer';
import HydrateClient from '@/components/providers/HydrateClient';

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