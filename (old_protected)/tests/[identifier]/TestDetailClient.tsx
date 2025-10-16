'use client';

import * as React from 'react';
import Link from 'next/link';
import { Box, Paper, Grid, Divider, Button, CircularProgress, Alert } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useQuery } from '@tanstack/react-query';

import TestDetailCharts from './components/TestDetailCharts';
import TestDetailData from './components/TestDetailData';
import TestToTestSet from './components/TestToTestSet';
import TestTags from './components/TestTags';
import { TasksAndCommentsWrapper } from '@/components/tasks/TasksAndCommentsWrapper';

import type { TestDetail, PromptReference } from '@/api-client/types.gen';
import {
    readTestTestsTestIdGetOptions,
    readPromptPromptsPromptIdGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

type CurrentUserShape = { id: string; name: string; picture?: string };

interface Props {
    identifier: string;
    currentUser: CurrentUserShape;
}

function Content({ identifier, currentUser }: Props) {
    const testOptions = React.useMemo(
        () => readTestTestsTestIdGetOptions({ path: { test_id: identifier } }),
        [identifier]
    );

    const testQuery = useQuery({
        ...testOptions,
        select: (resp): TestDetail => {
            if (!resp) throw new Error('Failed to load test');
            return resp;
        },
    });

    const promptId = testQuery.data?.prompt_id ?? '';

    const promptOptions = React.useMemo(
        () => readPromptPromptsPromptIdGetOptions({ path: { prompt_id: promptId as string } }),
        [promptId]
    );

    const promptQuery = useQuery({
        ...promptOptions,
        enabled: Boolean(promptId),
        select: (resp): PromptReference | undefined => {
            if (!resp) return undefined;
            return {
                id: resp.id ?? '',
                nano_id: resp.nano_id ?? '',
                content: resp.content,
                expected_response: resp.expected_response,
            };
        },
    });

    const isLoading = testQuery.isLoading || promptQuery.isLoading;
    const isError = testQuery.isError || promptQuery.isError;

    const mergedTest = React.useMemo<TestDetail | undefined>(() => {
        const base = testQuery.data;
        if (!base) return undefined;
        return promptQuery.data ? { ...base, prompt: promptQuery.data } : base;
    }, [testQuery.data, promptQuery.data]);

    const content = mergedTest?.prompt?.content ?? '';
    const title =
        content.length > 45 ? `${content.substring(0, 45)}...` : content || mergedTest?.id || identifier;

    const breadcrumbs = [
        { title: 'Tests', path: '/tests' },
        { title, path: `/tests/${identifier}` },
    ];

    if (isLoading) {
        return (
            <PageContainer title="Loading…" breadcrumbs={breadcrumbs}>
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

    if (isError || !mergedTest) {
        return (
            <PageContainer title="Error" breadcrumbs={breadcrumbs}>
                <Alert severity="error">Failed to load test detail.</Alert>
            </PageContainer>
        );
    }
    return (
        <PageContainer title={title} breadcrumbs={breadcrumbs}>
            <Box sx={{ flexGrow: 1, pt: 3 }}>
                <Box sx={{ mb: 4 }}>
                    <TestDetailCharts testId={identifier} />
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, mb: 4 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TestToTestSet
                                        testId={identifier}
                                        parentButton={
                                            mergedTest.parent_id ? (
                                                <Button
                                                    key="parent-button"
                                                    component={Link}
                                                    href={`/tests/${mergedTest.parent_id}`}
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<ArrowOutwardIcon />}
                                                >
                                                    Go to Parent
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TestDetailData test={mergedTest} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <TestTags test={mergedTest} />
                                </Grid>
                            </Grid>
                        </Paper>

                        <TasksAndCommentsWrapper
                            entityType="Test"
                            entityId={mergedTest.id}
                            currentUserId={currentUser.id}
                            currentUserName={currentUser.name}
                            currentUserPicture={currentUser.picture}
                        />
                    </Grid>
                </Grid>
            </Box>
        </PageContainer>
    );
}

export default function TestDetailClient(props: Props) {
    return <Content {...props} />;
}
