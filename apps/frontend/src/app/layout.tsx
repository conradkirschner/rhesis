// app/layout.tsx
import { type Metadata } from 'next';
import { auth } from '@/auth';
import ThemeContextProvider from '../components/providers/ThemeProvider';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import {
    readOrganizationOrganizationsOrganizationIdGetOptions,
    readUserUsersUserIdGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import { ClientLayoutShell } from './ClientLayoutShell';
import QueryProvider from './query-provider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: { template: '%s | Rhesis AI', default: 'Rhesis AI' },
    description: 'Rhesis AI | OSS Gen AI Testing Platform',
    icons: { icon: '/logos/rhesis-logo-favicon.svg' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // --- Prefetch (server) -----------------------------------------------------
    const qc = new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000 } },
    });

    const organizationId = (session?.user as any)?.organization_id as string | undefined;
    const userId = session?.user?.id;

    const jobs: Array<Promise<unknown>> = [];

    if (organizationId) {
        jobs.push(
            qc.prefetchQuery({
                ...readOrganizationOrganizationsOrganizationIdGetOptions({
                    path: { organization_id: organizationId },
                }),
                staleTime: 60_000,
            })
        );
    }

    if (userId) {
        jobs.push(
            qc.prefetchQuery({
                ...readUserUsersUserIdGetOptions({
                    path: { user_id: userId },
                }),
                staleTime: 60_000,
            })
        );
    }

    await Promise.all(jobs);
    const dehydratedState = dehydrate(qc);
    // --------------------------------------------------------------------------

    return (
        <html lang="en">
        <body>
        <QueryProvider>
            <ThemeContextProvider disableTransitionOnChange>
            <HydrationBoundary state={dehydratedState}>
                <ClientLayoutShell session={session}>{children}</ClientLayoutShell>
            </HydrationBoundary>
            </ThemeContextProvider></QueryProvider>
        </body>
        </html>
    );
}
