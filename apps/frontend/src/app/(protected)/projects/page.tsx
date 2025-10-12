export const dynamic = 'force-dynamic';

import { Paper, Alert } from '@mui/material';
import { auth } from '@/auth';

import { readProjectsProjectsGet } from '@/api-client/sdk.gen';

import ProjectsClientWrapper from './components/ProjectsClientWrapper';

export default async function ProjectsPage() {
    try {
        const session = await auth();

        if (!session?.session_token) {
            return (
                <Paper sx={{ p: 3 }}>
                    <Alert severity="error">
                        Authentication required. Please sign in to view projects.
                    </Alert>
                </Paper>
            );
        }

        const projects = await readProjectsProjectsGet({
            headers: { Authorization: `Bearer ${session.session_token}` },
            baseUrl: process.env.BACKEND_URL
        });

        return (
            <ProjectsClientWrapper
                initialProjects={projects?.data?.data}
                sessionToken={session.session_token}
            />
        );
    } catch (error) {
        console.error('Error loading projects:', error);
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to load projects. Please try again.'}
                </Alert>
            </Paper>
        );
    }
}
