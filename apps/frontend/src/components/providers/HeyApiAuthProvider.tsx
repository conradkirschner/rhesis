'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useSession } from 'next-auth/react';
import { client } from '@/api-client/client.gen';
import { setHeyApiAuthToken } from '@/api-client/heyapi.runtime';

type Props = { children: React.ReactNode; initialToken?: string };

export default function HeyApiAuthProvider({ children, initialToken }: Props) {
    const { data } = useSession();
    const sessionToken = (data as { session_token?: string } | null)?.session_token;

    const effectiveToken = sessionToken ?? initialToken; // prefer live session, fall back to SSR token

    // 1) Prime immediately on mount, before queries run
    useLayoutEffect(() => {
        if (effectiveToken) {
            setHeyApiAuthToken();
            client.setConfig({ auth: () => effectiveToken });
        }
    }, [effectiveToken]);

    // 2) Also react to future session changes (e.g., refresh)
    useEffect(() => {
        if (!effectiveToken) {
            setHeyApiAuthToken();
            client.setConfig({ auth: undefined });
        }
    }, [effectiveToken]);

    return <>{children}</>;
}
