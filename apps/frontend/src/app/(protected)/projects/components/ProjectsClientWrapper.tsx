'use client';

import React from 'react';
import { Box, Typography, Grid, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Link from 'next/link';
import { PageContainer } from '@toolpad/core/PageContainer';

import ProjectCard from './ProjectCard';
import styles from '@/styles/ProjectsClientWrapper.module.css';

import type { ProjectDetail } from '@/api-client/types.gen';

interface EmptyStateMessageProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

function EmptyStateMessage({ title, description, icon }: EmptyStateMessageProps) {
    return (
        <Paper elevation={2} className={styles.emptyState}>
            {icon || (
                <Box className={styles.iconContainer}>
                    <FolderIcon className={styles.primaryIcon} />
                    <AutoAwesomeIcon className={styles.secondaryIcon} />
                </Box>
            )}
            <Typography variant="h5" className={styles.title}>
                {title}
            </Typography>
            <Typography variant="body1" className={styles.description}>
                {description}
            </Typography>
        </Paper>
    );
}

interface ProjectsClientWrapperProps {
    initialProjects: ProjectDetail[] | undefined;
    sessionToken: string;
}

export default function ProjectsClientWrapper({
                                                  initialProjects,
                                              }: ProjectsClientWrapperProps) {
    const projects = initialProjects ?? [];

    return (
        <PageContainer title="Projects" breadcrumbs={[{ title: 'Projects', path: '/projects' }]}>
            {/* Header with actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
                <Button
                    component={Link}
                    href="/projects/create-new"
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                >
                    Create Project
                </Button>
            </Box>

            {/* Projects grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {projects.length > 0 &&
                    projects.map((project) => (
                        <Grid item key={project.id ?? project.name ?? Math.random()} xs={12} md={6} lg={4}>
                            <ProjectCard project={project} />
                        </Grid>
                    ))}

                {projects.length === 0 && (
                    <Grid item xs={12}>
                        <EmptyStateMessage
                            title="No projects found"
                            description="Create your first project to start building and testing your AI applications. Projects help you organize your work and collaborate with your team."
                        />
                    </Grid>
                )}
            </Grid>
        </PageContainer>
    );
}
