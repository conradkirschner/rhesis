'use client';

import { useState, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useActivePage } from '@toolpad/core/useActivePage';
import { PageContainer, type Breadcrumb } from '@toolpad/core/PageContainer';
import { EditIcon, DeleteIcon } from '@/components/icons';
import ProjectContent from '../components/ProjectContent';
import ProjectEditDrawer from './edit-drawer';
import { useNotifications } from '@/components/common/NotificationContext';
import { DeleteModal } from '@/components/common/DeleteModal';

import type { ProjectDetail, ProjectUpdate } from '@/api-client/types.gen';
import {
    updateProjectProjectsProjectIdPutMutation,
    deleteProjectProjectsProjectIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';

import { toProjectView, type ProjectView, type ProjectMeta } from '../types/project-ui';

interface ClientWrapperProps {
    project: ProjectDetail;
    sessionToken: string;
    projectId: string;
}

export default function ClientWrapper({
                                          project,
                                          sessionToken,
                                          projectId,
                                      }: ClientWrapperProps) {
    const router = useRouter();
    const params = useParams<{ identifier: string }>();
    const activePage = useActivePage();
    const notifications = useNotifications();

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState<ProjectView>(toProjectView(project));
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const title = currentProject.api.name || `Project ${params.identifier}`;

    let breadcrumbs: Breadcrumb[] = [];
    if (activePage) {
        const path = `${activePage.path}/${params.identifier}`;
        breadcrumbs = [...activePage.breadcrumbs, { title, path }];
    } else {
        breadcrumbs = [
            { title: 'Projects', path: '/projects' },
            { title, path: `/projects/${params.identifier}` },
        ];
    }

    const updateProjectMutation = useMutation(
        updateProjectProjectsProjectIdPutMutation({
            headers: { Authorization: `Bearer ${sessionToken}` },
        })
    );

    const deleteProjectMutation = useMutation(
        deleteProjectProjectsProjectIdDeleteMutation({
            headers: { Authorization: `Bearer ${sessionToken}` },
        })
    );

    const isUpdating = updateProjectMutation.isPending;
    const isDeleting = deleteProjectMutation.isPending;

    const handleUpdateProject = useCallback(
        async (updatedProject: Partial<ProjectUpdate>, updatedMeta: ProjectMeta) => {
            try {
                const updated = await updateProjectMutation.mutateAsync({
                    path: { project_id: projectId },
                    body: updatedProject,
                });

                setCurrentProject(prev => toProjectView(updated as ProjectDetail, { ...prev.meta, ...updatedMeta }));
                setIsDrawerOpen(false);
                notifications.show('Project updated successfully', { severity: 'success' });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to update project';
                notifications.show(message, { severity: 'error' });
                throw err; // preserve rejection to satisfy Promise contract if caller awaits
            }
        },
        [projectId, updateProjectMutation, notifications]
    );

    const handleDeleteClick = () => setDeleteConfirmOpen(true);
    const handleDeleteCancel = () => setDeleteConfirmOpen(false);
    const handleDeleteConfirm = () => {
        deleteProjectMutation.mutate(
            { path: { project_id: projectId } },
            {
                onSuccess: () => {
                    notifications.show('Project deleted successfully', { severity: 'success' });
                    router.push('/projects');
                },
                onError: (err) => {
                    const message = err instanceof Error ? err.message : 'Failed to delete project';
                    notifications.show(message, { severity: 'error' });
                    setDeleteConfirmOpen(false);
                },
            }
        );
    };

    return (
        <PageContainer title={title} breadcrumbs={breadcrumbs}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsDrawerOpen(true)}
                    disabled={isUpdating || isDeleting}
                    sx={{ mr: 2 }}
                >
                    Edit Project
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteClick}
                    disabled={isUpdating || isDeleting}
                >
                    Delete
                </Button>
            </Box>

            {/* API+UI view model */}
            <ProjectContent project={currentProject} />

            <ProjectEditDrawer
                project={currentProject.api}
                meta={currentProject.meta}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleUpdateProject}
            />

            <DeleteModal
                open={deleteConfirmOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                itemType="project"
                itemName={currentProject.api.name ?? ''}
                title="Delete Project"
            />
        </PageContainer>
    );
}
