'use client';

import * as React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import PassRateTimelineChart from './PassRateTimelineChart';
import LatestResultsPieChart from './LatestResultsPieChart';
import LatestTestRunsChart from './LatestTestRunsChart';
import DimensionRadarChart from './DimensionRadarChart';
import MetricTimelineChartsGrid from './MetricTimelineChartsGrid';
import TestResultsSummary from './TestResultsSummary';

interface TestResultsChartsProps {
    // Keep filters simple and aligned with refactored children (months only)
    filters: Partial<{ months: number }>;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`charts-tabpanel-${index}`}
            aria-labelledby={`charts-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `charts-tab-${index}`,
        'aria-controls': `charts-tabpanel-${index}`,
    };
}


export default function TestResultsCharts({ filters }: TestResultsChartsProps) {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const sectionSmall = theme.customSpacing?.section?.small ?? 2;
    const sectionMedium = theme.customSpacing?.section?.medium ?? 3;

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box>
            <Tabs
                value={value}
                onChange={handleChange}
                aria-label="test results charts tabs"
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: sectionSmall,
                }}
            >
                <Tab label="Overview" {...a11yProps(0)} />
                <Tab label="Pass Rate" {...a11yProps(1)} />
                <Tab label="Dimensions" {...a11yProps(2)} />
                <Tab label="Metrics" {...a11yProps(3)} />
            </Tabs>

            <TabPanel value={value} index={0}>
                {/* Summary Tab - Test Run Summary and Metadata */}
                <TestResultsSummary  filters={filters} />
            </TabPanel>

            <TabPanel value={value} index={1}>
                {/* At a Glance Tab - Timeline, Test Runs, and Overall Results */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: '1fr 1fr',
                            lg: '1fr 1fr 1fr',
                        },
                        gap: sectionMedium,
                    }}
                >
                    {/* Overall Results (summary mode) */}
                    <LatestResultsPieChart filters={filters} />

                    {/* Pass Rate Timeline (timeline mode) */}
                    <PassRateTimelineChart  filters={filters} />

                    {/* Latest Test Runs (test_runs mode) */}
                    <LatestTestRunsChart  filters={filters} />
                </Box>
            </TabPanel>

            <TabPanel value={value} index={2}>
                {/* In Detail Tab - Radar Charts */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' },
                        gap: sectionMedium,
                    }}
                >
                    <DimensionRadarChart

                        filters={filters}
                        dimension="behavior"
                        title="Behavior"
                    />
                    <DimensionRadarChart

                        filters={filters}
                        dimension="category"
                        title="Category"
                    />
                    <DimensionRadarChart

                        filters={filters}
                        dimension="topic"
                        title="Topic"
                    />
                </Box>
            </TabPanel>

            <TabPanel value={value} index={3}>
                {/* Metrics Over Time Tab - Dynamic Metric Timeline Charts */}
                <MetricTimelineChartsGrid  filters={filters} />
            </TabPanel>
        </Box>
    );
}
