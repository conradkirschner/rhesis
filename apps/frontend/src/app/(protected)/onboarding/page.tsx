import { auth } from '@/auth';
import OnboardingContainer from './components/OnboardingContainer';

export default async function Page() {
  const session = await auth();

  if (!session?.session_token) {
    throw new Error('No session token available');
  }
  if (!session?.user?.id) {
    throw new Error('No user ID available in session');
  }

  return <OnboardingContainer userId={session.user.id} />;
}