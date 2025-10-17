import { QueryClient, dehydrate } from '@tanstack/react-query';
import { prefetchOrganizationSettings } from '@/hooks/data/OrganizationSettings/prefetchOrganizationSettings';
import OrganizationSettingsContainer from './components/OrganizationSettingsContainer';
import HydrateClient from '@/components/providers/HydrateClient';
import { auth } from '@/auth';

export default async function TeamPage() {
  const queryClient = new QueryClient();
  const session = await auth();
  if (!session) {
    throw new Error('Session not found');
  }
  if (!session.user?.organization_id) {
    throw new Error('Session not found');
  }
  await prefetchOrganizationSettings(queryClient, session.user.organization_id);
  const state = dehydrate(queryClient);

  return (
    <HydrateClient state={state}>
      <OrganizationSettingsContainer organizationId={ session.user.organization_id}/>
    </HydrateClient>
  );
}