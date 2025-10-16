import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrateClient } from '@/components/providers/HydrateClient';
import { prefetchTasks } from '@/hooks/data';
import TasksContainer from './components/TasksContainer';

export default async function Page() {
  const qc = new QueryClient();

  await prefetchTasks(qc, { skip: 0, limit: 25 });

  const state = dehydrate(qc);

  return (
    <HydrateClient state={state}>
      <TasksContainer />
    </HydrateClient>
  );
}