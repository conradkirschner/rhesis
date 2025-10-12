'use client';

import * as React from 'react';
import { Box, Typography, Paper, Chip, useTheme } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TestResultTags from './TestResultTags';

/** Infer the exact test result type from TestResultTags props (no api-client imports) */
type TestResultFromTags = React.ComponentProps<typeof TestResultTags>['testResult'];

interface TestDetailOverviewTabProps {
    test: TestResultFromTags;
    prompts: Record<string, { content: string; name?: string }>;
    onTestResultUpdate: (updatedTest: TestResultFromTags) => void;
}

export default function TestDetailOverviewTab({
                                                  test,
                                                  prompts,
                                                  onTestResultUpdate,
                                              }: TestDetailOverviewTabProps) {
    const theme = useTheme();

    const promptContent =
        (test.prompt_id && prompts[test.prompt_id]?.content) || 'No prompt available';

    const responseContent = (test.test_output as {output: string}).output || 'No response available';

    // Compute overall status (cheap enough to do directly without useMemo)
    const metricValues = Object.values(test.test_metrics?.metrics ?? {}) as Array<{
        is_successful?: boolean | null;
    }>;
    const overallPassed =
        metricValues.length > 0 &&
        metricValues.every((m) => Boolean(m?.is_successful));

    return (
        <Box sx={{ p: 3 }}>
            {/* Overall Status */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Test Result
                    </Typography>
                    <Chip
                        icon={overallPassed ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />}
                        label={overallPassed ? 'Passed' : 'Failed'}
                        color={overallPassed ? 'success' : 'error'}
                        sx={{ fontWeight: 600 }}
                    />
                </Box>
            </Box>

            {/* Prompt Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Prompt
                </Typography>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        backgroundColor: theme.palette.background.default,
                        maxHeight: 200,
                        overflow: 'auto',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                        }}
                    >
                        {promptContent}
                    </Typography>
                </Paper>
            </Box>

            {/* Response Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Response
                </Typography>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        backgroundColor: theme.palette.background.default,
                        maxHeight: 200,
                        overflow: 'auto',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                        }}
                    >
                        {responseContent}
                    </Typography>
                </Paper>
            </Box>

            {/* Tags Section */}
            <Box sx={{ mb: 3 }}>
                <TestResultTags
                    testResult={test}
                    onUpdate={onTestResultUpdate}
                />
            </Box>
        </Box>
    );
}
