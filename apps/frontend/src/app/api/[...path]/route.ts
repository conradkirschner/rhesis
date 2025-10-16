// app/_api/[...path]/route.ts  (add keep-alive to speed up proxy hops)
import { NextRequest } from 'next/server';
import { getSessionToken } from '@/api-client/auth.server';
import { Agent, setGlobalDispatcher } from 'undici';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reuse a single agent with keep-alive across requests
const agent = new Agent({ keepAliveTimeout: 10_000, keepAliveMaxTimeout: 60_000, connections: 128 });
setGlobalDispatcher(agent);

function joinPath(a: string, b: string) {
    return `${a.replace(/\/+$/, '')}/${b.replace(/^\/+/, '')}`;
}

async function handler(req: NextRequest) {
    const backend = process.env.BACKEND_URL; // e.g. http://backend:8080
    if (!backend) return new Response('BACKEND_URL not set', { status: 500 });

    const path = req.nextUrl.pathname.replace(/^\/api\//, '');
    const url = new URL(backend);
    url.pathname = joinPath(url.pathname, path);
    url.search = req.nextUrl.search;

    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('content-length');
    headers.delete('connection');
    headers.set('accept-encoding', 'identity');

    const token = await getSessionToken();
    if (token) headers.set('authorization', `Bearer ${token}`);

    const method = req.method.toUpperCase();
    const init: RequestInit & { dispatcher?: Agent } = {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : (req.body as any),
        ...(method !== 'GET' && method !== 'HEAD' ? { duplex: 'half' as any } : {}),
        dispatcher: agent, // ✅ keep-alive
    };

    const t0 = performance.now();
    const resp = await fetch(url, init);
    const t1 = performance.now();
    console.log(`[/api] ${method} ${url.href} -> ${resp.status} in ${Math.round(t1 - t0)}ms`);

    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
