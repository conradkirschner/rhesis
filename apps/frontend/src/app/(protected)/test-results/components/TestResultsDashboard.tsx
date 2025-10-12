'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import TestResultsFilters from './TestResultsFilters';
import TestResultsCharts from './TestResultsCharts';


// Keep filters simple and aligned with the rest of the charts (months only)
type Filters = Partial<{ months: number }>;

export default function TestResultsDashboard() {
    const theme = useTheme();
    const sectionMedium = theme.customSpacing?.section?.medium ?? 3;

    const [filters, setFilters] = React.useState<Filters>({ months: 6 });

    const handleFiltersChange = React.useCallback((newFilters: Filters) => {
        setFilters(newFilters);
    }, []);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: sectionMedium,
            }}
        >
            {/* Filters */}
            <TestResultsFilters
                onFiltersChange={handleFiltersChange}
                initialFilters={filters}
            />

            {/* Charts - Each chart makes its own API call in parallel */}
            <TestResultsCharts filters={filters} />
        </Box>
    );
}
