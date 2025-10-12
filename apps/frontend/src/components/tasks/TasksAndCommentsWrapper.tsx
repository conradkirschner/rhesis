'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Paper, Divider } from '@mui/material';
import { TasksSection } from './TasksSection';
import CommentsWrapper from '@/components/comments/CommentsWrapper';

// TanStack task hooks you created earlier
import { useCreateTask, useDeleteTask } from '@/hooks/useTasks';
import {type RhesisBackendAppSchemasTagEntityType, TaskCreate} from "@/api-client";

interface TasksAndCommentsWrapperProps {
    entityType: RhesisBackendAppSchemasTagEntityType;
    entityId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserPicture?: string;
    elevation?: number;
}

export function TasksAndCommentsWrapper({
                                            entityType,
                                            entityId,
                                            currentUserId,
                                            currentUserName,
                                            currentUserPicture,
                                            elevation = 1,
                                        }: TasksAndCommentsWrapperProps) {
    const router = useRouter();

    const createTaskMutation = useCreateTask();
    const deleteTaskMutation = useDeleteTask();

    const handleCreateTask = useCallback(
        async (taskData: TaskCreate) => {
            try {
                await createTaskMutation.mutateAsync({ body: taskData } as never);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to create task:', error);
            }
        },
        [createTaskMutation]
    );

    const handleEditTask = useCallback((taskId: string) => {
        // Open task detail in a new tab
        window.open(`/tasks/${taskId}`, '_blank');
    }, []);

    const handleDeleteTask = useCallback(
        async (taskId: string) => {
            try {
                await deleteTaskMutation.mutateAsync({ path: { task_id: taskId } } as never);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to delete task:', error);
            }
        },
        [deleteTaskMutation]
    );

    const handleCreateTaskFromComment = useCallback(
        (commentId: string) => {
            const params = new URLSearchParams({
                entityType,
                entityId,
                commentId,
            });
            router.push(`/tasks/create?${params.toString()}`);
        },
        [router, entityType, entityId]
    );

    const handleCreateTaskFromEntity = useCallback(() => {
        const params = new URLSearchParams({
            entityType,
            entityId,
        });
        router.push(`/tasks/create?${params.toString()}`);
    }, [router, entityType, entityId]);

    return (
        <Paper elevation={elevation} sx={{ p: 3 }} suppressHydrationWarning>
            {/* Tasks Section */}
            <TasksSection
                entityType={entityType}
                entityId={entityId}
                onCreateTask={handleCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
            />

            {/* Divider between Tasks and Comments */}
            <Divider sx={{ my: 3 }} />

            {/* Comments Section with Task Creation Integration */}
            <CommentsWrapper
                entityType={entityType}
                entityId={entityId}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserPicture={currentUserPicture}
                onCreateTask={handleCreateTaskFromComment}
                onCreateTaskFromEntity={handleCreateTaskFromEntity}
            />
        </Paper>
    );
}
