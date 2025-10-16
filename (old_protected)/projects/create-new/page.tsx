import { Box } from '@mui/material';
import { auth } from '@/auth';
import CreateProjectClient from './components/CreateProjectClient';

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
  return (
      <Box sx={{ p: 0 }}>
        <CreateProjectClient
            sessionToken={session.session_token}
            userId={String(session.user.id)}
            organizationId={organizationId}
            userName={session.user.name ?? ''}
            userImage={session.user.picture ?? ''}
        />
      </Box>
  );
}
