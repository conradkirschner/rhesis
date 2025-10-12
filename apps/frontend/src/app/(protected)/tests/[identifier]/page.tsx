// app/tests/[identifier]/page.tsx
import * as React from 'react';
import { auth } from '@/auth';
import TestDetailClient from './TestDetailClient';

interface PageProps {
    params: Promise<{ identifier: string }>;
}

export default async function Page({ params }: PageProps) {
    const session = await auth();
    if (!session?.session_token) {
        throw new Error('No session token available');
    }

    const { identifier } = await params;

    return (
        <TestDetailClient
            identifier={identifier}
            backendBaseUrl={process.env.BACKEND_URL ?? ''}
            sessionToken={session.session_token}
            currentUser={{
                id: session.user?.id ?? '',
                name: session.user?.name ?? '',
                picture: session.user?.picture ?? undefined,
            }}
        />
    );
}
