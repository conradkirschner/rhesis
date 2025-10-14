'use client';

import * as React from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

import { readOrganizationOrganizationsOrganizationIdGetOptions } from '@/api-client/@tanstack/react-query.gen';
import type { Organization } from '@/api-client/types.gen';

import OrganizationDetailsForm from './components/OrganizationDetailsForm';
import ContactInformationForm from './components/ContactInformationForm';
import DomainSettingsForm from './components/DomainSettingsForm';
import SubscriptionInfo from './components/SubscriptionInfo';
import DangerZone from './components/DangerZone';

export default function OrganizationSettingsPage() {
    const { data: session } = useSession();
    const orgId = session?.user?.organization_id ?? '';

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        ...readOrganizationOrganizationsOrganizationIdGetOptions({
            path: { organization_id: orgId },
        }),
        enabled: Boolean(orgId),
    });

    const organization = (data as Organization | undefined) ?? null;

    const handleUpdate = React.useCallback(() => {
        void refetch();
    }, [refetch]);

    if (!orgId) {
        return (
            <PageContainer title="Organization Settings">
                <Alert severity="warning" sx={{ mb: 3 }}>
                    No organization in session. Please contact support.
                </Alert>
            </PageContainer>
        );
    }

    if (isLoading) {
        return (
            <PageContainer title="Organization Settings">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

    if (isError) {
        return (
            <PageContainer title="Organization Settings">
                <Alert severity="error" sx={{ mb: 3 }}>
                    {(error as Error)?.message || 'Failed to load organization details'}
                </Alert>
            </PageContainer>
        );
    }

    if (!organization) {
        return (
            <PageContainer title="Organization Settings">
                <Alert severity="warning" sx={{ mb: 3 }}>
                    No organization found. Please contact support.
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="Organization Settings">
            {/* Basic Information Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Basic Information
                </Typography>
                <OrganizationDetailsForm
                    organization={organization}
                    sessionToken={session?.session_token || ''}
                    onUpdate={handleUpdate}
                />
            </Paper>

            {/* Contact Information Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Contact Information
                </Typography>
                <ContactInformationForm
                    organization={organization}
                    onUpdate={handleUpdate}
                />
            </Paper>

            {/* Domain Settings Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Domain Settings
                </Typography>
                <DomainSettingsForm
                    organization={organization}
                    sessionToken={session?.session_token || ''}
                    onUpdate={handleUpdate}
                />
            </Paper>

            {/* Subscription Information Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Subscription
                </Typography>
                <SubscriptionInfo organization={organization} />
            </Paper>

            {/* Danger Zone Section */}
            <Paper sx={{ p: 3 }}>
                <DangerZone
                    organization={organization}
                    sessionToken={session?.session_token || ''}
                />
            </Paper>
        </PageContainer>
    );
}
