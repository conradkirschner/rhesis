// components/providers/HydrateClient.tsx
'use client';

import { ReactNode, useState } from 'react';
import {
    QueryClient,
    DehydratedState, HydrationBoundary, dehydrate,
} from '@tanstack/react-query';

type HydrateClientProps = {
    children: ReactNode;
    state?: DehydratedState;
};

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Adjust to your app’s needs:
                staleTime: 60_000, // avoid immediate refetch after hydration
                gcTime: 5 * 60_000,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        },
    });
}

// Reuse a single client on the browser, a fresh one per request on the server
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

export default function HydrateClient({ children }: HydrateClientProps) {
    const [queryClient] = useState(getQueryClient);
    const dehydratedState = dehydrate(queryClient);

    return (
            <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    );
}
