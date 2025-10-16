// app/(protected)/shell/ui/LayoutScaffold.tsx
'use client';

import * as React from 'react';
import { Box, useTheme } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { NotificationProvider } from '@/components/common/NotificationContext';
import { NavigationProvider } from '@/components/navigation/NavigationProvider';
import { handleSignIn, handleSignOut } from '@/actions/auth';
import ThemeAwareLogo from '@/components/common/ThemeAwareLogo';

import {
    DashboardIcon,
    ScienceIcon,
    AppsIcon,
    VpnKeyIcon,
    BusinessIcon,
    GroupIcon,
    PlayArrowIcon,
    AssessmentIcon,
    CategoryIcon,
    AutoGraphIcon,
    IntegrationInstructionsIcon,
    SmartToyIcon,
    GridViewIcon,
    ApiIcon,
    TerminalIcon,
    AssignmentIcon,
    SettingsIcon,
} from '@/components/icons';

import type { Session } from 'next-auth';
import type { NavigationItem, BrandingProps, AuthenticationProps } from '@/types/navigation';

const BRANDING: BrandingProps = {
    title: '',
    logo: <ThemeAwareLogo />,
};

const AUTHENTICATION: AuthenticationProps = {
    signIn: handleSignIn,
    signOut: handleSignOut,
};

export function buildNavigation(organizationName: string): NavigationItem[] {
    return [
        {
            kind: 'page',
            segment: 'organizations',
            title: organizationName,
            icon: <BusinessIcon />,
            children: [
                { kind: 'page', segment: 'settings', title: 'Settings', icon: <SettingsIcon /> },
                { kind: 'page', segment: 'team', title: 'Team', icon: <GroupIcon /> },
            ],
        },
        { kind: 'page', segment: 'projects', title: 'Projects', icon: <AppsIcon /> },
        { kind: 'divider' },
        { kind: 'page', segment: 'dashboard', title: 'Dashboard', icon: <DashboardIcon /> },
        { kind: 'page', segment: 'tests', title: 'Tests', icon: <ScienceIcon /> },
        { kind: 'page', segment: 'test-sets', title: 'Test Sets', icon: <CategoryIcon /> },
        { kind: 'page', segment: 'test-runs', title: 'Test Runs', icon: <PlayArrowIcon /> },
        { kind: 'page', segment: 'test-results', title: 'Test Results', icon: <AssessmentIcon /> },
        { kind: 'page', segment: 'tasks', title: 'Tasks', icon: <AssignmentIcon /> },
        { kind: 'page', segment: 'metrics', title: 'Metrics', icon: <AutoGraphIcon />, requireSuperuser: true },
        { kind: 'header', title: 'Settings' },
        { kind: 'page', segment: 'endpoints', title: 'Endpoints', icon: <ApiIcon /> },
        {
            kind: 'page',
            segment: 'integrations',
            title: 'Integrations',
            icon: <IntegrationInstructionsIcon />,
            requireSuperuser: true,
            children: [
                { kind: 'page', segment: 'applications', title: 'Applications', icon: <GridViewIcon /> },
                { kind: 'page', segment: 'tools', title: 'Tools', icon: <TerminalIcon /> },
                { kind: 'page', segment: 'llm-providers', title: 'LLM Providers', icon: <SmartToyIcon /> },
            ],
        },
        { kind: 'page', segment: 'tokens', title: 'API Tokens', icon: <VpnKeyIcon /> },
    ];
}

export default function LayoutScaffold({
                                           children,
                                           navigation,
                                           session,
                                       }: {
    children: React.ReactNode;
    navigation: NavigationItem[];
    session: Session | null;
}) {
    const theme = useTheme();

    return (
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <NotificationProvider>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Box sx={{ flex: 1 }}>
                        <NavigationProvider
                            navigation={navigation}
                            branding={BRANDING}
                            session={session}
                            authentication={AUTHENTICATION}
                            theme={theme}
                        >
                            {children}
                        </NavigationProvider>
                    </Box>
                </Box>
            </NotificationProvider>
        </AppRouterCacheProvider>
    );
}
