// app/shell/hooks/useOrganizationName.ts
'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
    readOrganizationOrganizationsOrganizationIdGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import type { Session } from 'next-auth';

type ExtendedUser = Session['user'] & { organization_id?: string | null };

export function useOrganizationName(): string {
    const { data: session } = useSession();
    const orgId =
        (session?.user as ExtendedUser | undefined)?.organization_id ?? undefined;

    const enabled = Boolean(orgId);

    const { data } = useQuery({
        ...readOrganizationOrganizationsOrganizationIdGetOptions({
            path: { organization_id: orgId ?? '' },
        }),
        enabled,
        staleTime: 60_000,
        select: (resp) => resp?.name?.trim() || 'Organization',
    });

    return data ?? 'Organization';
}
