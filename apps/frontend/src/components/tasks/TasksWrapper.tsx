'use client';

import React, { useCallback } from 'react';
import { EntityType } from '@/types/tasks';
import { TasksSection } from './TasksSection';
import { useCreateTask, useDeleteTask } from '@/hooks/useTasks';
import {TaskCreate} from "@/api-client";


interface TasksWrapperProps {
    entityType: EntityType;
    entityId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserPicture?: string;
}

export function TasksWrapper({
                                 entityType,
                                 entityId,
                                 currentUserId,
                                 currentUserName,
                             }: TasksWrapperProps) {
    const createTaskMutation = useCreateTask();
    const deleteTaskMutation = useDeleteTask();

    const handleCreateTask = useCallback(
        async (taskData: TaskCreate) => {
            await createTaskMutation.mutateAsync({ body: taskData } as never);
        },
        [createTaskMutation]
    );

    const handleEditTask = useCallback((taskId: string) => {
        window.open(`/tasks/${taskId}`, '_blank');
    }, []);

    const handleDeleteTask = useCallback(
        async (taskId: string) => {
            await deleteTaskMutation.mutateAsync({ path: { task_id: taskId } } as never);
        },
        [deleteTaskMutation]
    );

    return (
        <TasksSection
            entityType={entityType}
            entityId={entityId}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
        />
    );
}
