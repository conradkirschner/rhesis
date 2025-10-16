import { auth } from '@/auth';
import OnboardingPageClient from './components/OnboardingPageClient';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.session_token) {
    throw new Error('No session token available');
  }

  if (!session?.user?.id) {
    throw new Error('No user ID available in session');
  }

  return (
    <OnboardingPageClient
      userId={session.user.id}
    />
  );
}
