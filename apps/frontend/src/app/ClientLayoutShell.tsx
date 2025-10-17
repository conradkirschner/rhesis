'use client';

import { ReactNode } from 'react';
import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ClientLayoutShell as _Inner } from './ClientLayoutShell.impl';

export function ClientLayoutShell({
                                      session,
                                      children,
                                      dehydratedState,
                                  }: {
    session: Session | null;
    children: ReactNode;
    dehydratedState?: DehydratedState;
}) {
    return (
            <SessionProvider session={session}>
                <HydrationBoundary state={dehydratedState}>
                    <_Inner session={session}>{children}</_Inner>
                </HydrationBoundary>
            </SessionProvider>
    );
}
