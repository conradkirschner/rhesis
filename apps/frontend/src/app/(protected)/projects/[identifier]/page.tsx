import { auth } from '@/auth';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchProject } from '@/hooks/data';
import ProjectContainer from './components/ProjectContainer';

interface PageProps {
    params: Promise<{ identifier: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
    const session = await auth();
    const awaitedparams = await params;
    if (!session?.session_token) {
        throw new Error('No session token available');
    }

    const queryClient = new QueryClient();

    await prefetchProject(queryClient, {
        projectId: awaitedparams.identifier,
        sessionToken: session.session_token,
    });

    const state = dehydrate(queryClient);

    return (
        <HydrationBoundary state={state}>
            <ProjectContainer projectId={awaitedparams.identifier} sessionToken={session.session_token} />
        </HydrationBoundary>
    );
}