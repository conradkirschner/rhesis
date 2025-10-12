import { auth } from '@/auth';

import { readProjectProjectsProjectIdGet } from '@/api-client/sdk.gen';

import ClientWrapper from './client-wrapper';

interface PageProps {
  params: Promise<{ identifier: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
    const session = await auth();
    if (!session?.session_token) {
      throw new Error('No session token available');
    }

    const { identifier } = await params;

    const { data: project, error } = await readProjectProjectsProjectIdGet({
        path: { project_id: identifier },
        baseUrl: process.env.BACKEND_URL,
        headers: {'Authorization': `Bearer ${session.session_token}`}
    });

    if (error) {
      throw new Error(
          typeof error === 'string'
              ? error
              : (error as any)?.message || 'Failed to load project'
      );
    }
    if (!project) {
      throw new Error('Project not found');
    }
    return (
        <ClientWrapper
            project={project}
            sessionToken={session.session_token}
            projectId={project.id}
        />
    );
}
