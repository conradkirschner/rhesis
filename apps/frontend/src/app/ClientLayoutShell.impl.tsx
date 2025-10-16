// app/ClientLayoutShell.impl.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import type { Session } from 'next-auth';
import { useOrganizationName } from '@/hooks/useOrganizationName';
import LayoutScaffold, { buildNavigation } from './LayoutScaffold';
import {useSession} from "next-auth/react";

export function ClientLayoutShell({
                                      session,
                                      children,
                                  }: {
    session: Session | null;
    children: ReactNode;
}) {
    const orgName = useOrganizationName();
    const user = useSession()
    const patchedSession = user.data ?? null;
    const navigation = useMemo(() => buildNavigation(orgName), [orgName]);

    return (
        <LayoutScaffold session={patchedSession} navigation={navigation}>
            {children}
        </LayoutScaffold>
    );
}
