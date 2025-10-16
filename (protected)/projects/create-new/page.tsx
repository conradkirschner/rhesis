import { auth } from '@/auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchCreateProject } from '@/hooks/data';
import HydrateClient from '@/providers/HydrateClient';
import CreateProjectContainer from './components/CreateProjectContainer';

export default async function CreateProjectPage() {
  const session = await auth();

  if (!session?.session_token) {
    throw new Error('No session token available');
  }
  if (!session?.user?.id) {
    throw new Error('No user ID available in session');
  }
  const organizationId = session.user.organization_id;
  if (!organizationId) {
    throw new Error('No organization ID available in session');
  }

  const queryClient = new QueryClient();
  await prefetchCreateProject({ queryClient, ownerId: String(session.user.id) });
  const state = dehydrate(queryClient);

  return (
    <HydrateClient state={state}>
      <CreateProjectContainer
        userId={String(session.user.id)}
        organizationId={organizationId}
        userName={session.user.name ?? ''}
        userImage={session.user.picture ?? ''}
      />
    </HydrateClient>
  );
}