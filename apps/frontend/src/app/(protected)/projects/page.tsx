export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchProjects } from '@/hooks/data/Projects/prefetchProjects';
import ProjectsContainer from './components/ProjectsContainer';

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.session_token) {
    redirect('/signin?next=/projects');
  }

  const queryClient = new QueryClient();
  await prefetchProjects(queryClient, {
    sessionToken: session.session_token,
    baseUrl: process.env.BACKEND_URL,
  });

  const state = dehydrate(queryClient);

  return (
    <HydrationBoundary state={state}>
      <ProjectsContainer sessionToken={session.session_token} baseUrl={process.env.BACKEND_URL} />
    </HydrationBoundary>
  );
}