// app/api/[...path]/route.ts
import { NextRequest } from 'next/server';
import { getSessionToken } from '@/api-client/auth.server';
import { Agent, setGlobalDispatcher } from 'undici';
import Redis from 'ioredis';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------- Keep-Alive ----------
const agent = new Agent({ keepAliveTimeout: 10_000, keepAliveMaxTimeout: 60_000, connections: 128 });
setGlobalDispatcher(agent);

// ---------- Redis (DB=2; keep broker/result DBs 0/1 free) ----------
const REDIS_PREFIX = 'httpcache:v1:';
const REDIS_LOCK_PREFIX = `${REDIS_PREFIX}lock:`;
const DEFAULT_SWR_SECONDS = 30;
const MAX_STALE_SECONDS = 5 * 60;

function safeCacheRedisUrl(): string {
    const envUrl = process.env.CACHE_REDIS_URL || process.env.REDIS_URL || '';
    if (!envUrl) return `redis://:${process.env.REDIS_PASSWORD ?? ''}@redis:${process.env.REDIS_PORT ?? '6379'}/2`;
    try {
        const u = new URL(envUrl);
        const db = u.pathname?.replace(/^\//, '');
        if (!db || db === '0' || db === '1') u.pathname = '/2';
        return u.toString();
    } catch {
        return envUrl;
    }
}

let _redis: Redis | null = null;
function getRedis(): Redis {
    if (_redis) return _redis;
    _redis = new Redis(safeCacheRedisUrl(), {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        connectTimeout: 5_000,
        keepAlive: 10_000,
    });
    _redis.on('error', () => {});
    return _redis;
}

// ---------- Types ----------
type CacheEntry = {
    url: string;
    status: number;
    statusText: string;
    headers: [string, string][];
    bodyB64: string;
    etag?: string | null;
    lastModified?: string | null;
    cacheControl?: string | null;
    storedAt: number;
    expiresAt: number;
    swrUntil?: number;
};

// ---------- Utils ----------
function joinPath(a: string, b: string) {
    return `${a.replace(/\/+$/, '')}/${b.replace(/^\/+/, '')}`;
}
function parseCacheControl(cc: string | null | undefined) {
    const res: { public?: boolean; private?: boolean; noStore?: boolean; noCache?: boolean; maxAge?: number; sMaxAge?: number; staleWhileRevalidate?: number } = {};
    if (!cc) return res;
    const parts = cc.toLowerCase().split(',').map((p) => p.trim());
    for (const p of parts) {
        if (p === 'public') res.public = true;
        else if (p === 'private') res.private = true;
        else if (p === 'no-store') res.noStore = true;
        else if (p === 'no-cache') res.noCache = true;
        else if (p.startsWith('max-age=')) { const v = Number(p.split('=')[1]); if (!Number.isNaN(v)) res.maxAge = v; }
        else if (p.startsWith('s-maxage=')) { const v = Number(p.split('=')[1]); if (!Number.isNaN(v)) res.sMaxAge = v; }
        else if (p.startsWith('stale-while-revalidate=')) { const v = Number(p.split('=')[1]); if (!Number.isNaN(v)) res.staleWhileRevalidate = v; }
    }
    return res;
}
function copyHeaders(src: Headers | [string, string][], extras?: Record<string, string>): Headers {
    const h = new Headers();
    const add = (k: string, v: string) => {
        if (['connection','transfer-encoding','keep-alive','proxy-authenticate','proxy-authorization','te','trailers','upgrade'].includes(k.toLowerCase())) return;
        h.append(k, v);
    };
    if (Array.isArray(src)) { for (const [k, v] of src) add(k, v); } else { src.forEach((v, k) => add(k, v)); }
    if (extras) for (const [k, v] of Object.entries(extras)) h.set(k, v);
    return h;
}
function isClientConditionalHit(req: NextRequest, entry: CacheEntry) {
    const inm = req.headers.get('if-none-match');
    const ims = req.headers.get('if-modified-since');
    if (inm && entry.etag && inm.split(',').map((s) => s.trim()).includes(entry.etag)) return true;
    if (ims && entry.lastModified) {
        const imsTime = Date.parse(ims); const lmTime = Date.parse(entry.lastModified);
        if (!Number.isNaN(imsTime) && !Number.isNaN(lmTime) && lmTime <= imsTime) return true;
    }
    return false;
}
const cacheKeyFor = (u: string) => `${REDIS_PREFIX}${createHash('sha256').update(u).digest('hex')}`;
const lockKeyFor  = (u: string) => `${REDIS_LOCK_PREFIX}${createHash('sha256').update(u).digest('hex')}`;

async function readCache(u: string): Promise<CacheEntry | null> {
    try {
        const redis = getRedis();
        if (!redis.status || redis.status === 'end') await redis.connect().catch(() => null);
        const raw = await redis.getBuffer(cacheKeyFor(u));
        return raw ? (JSON.parse(raw.toString('utf8')) as CacheEntry) : null;
    } catch { return null; }
}
async function writeCache(u: string, entry: CacheEntry, ttlSeconds: number) {
    try {
        const redis = getRedis();
        if (!redis.status || redis.status === 'end') await redis.connect().catch(() => null);
        await redis.set(cacheKeyFor(u), Buffer.from(JSON.stringify(entry), 'utf8'), 'EX', Math.max(1, Math.ceil(ttlSeconds)));
    } catch {}
}
async function delCache(u: string) {
    try {
        const redis = getRedis();
        if (!redis.status || redis.status === 'end') await redis.connect().catch(() => null);
        await redis.del(cacheKeyFor(u));
    } catch {}
}
async function acquireLock(u: string, ttlSec: number): Promise<boolean> {
    try {
        const redis = getRedis();
        if (!redis.status || redis.status === 'end') await redis.connect().catch(() => null);
        // ioredis: set key value 'EX' seconds 'NX'
        const ok = await redis.set(lockKeyFor(u), '1', 'EX', Math.max(1, Math.ceil(ttlSec)), 'NX');
        return ok === 'OK';
    } catch { return false; }
}
const schedule = (fn: () => Promise<void>) => { setImmediate(() => { void fn(); }); };

async function revalidateInBackground(opts: {
    url: URL; cached: CacheEntry | null; baseInit: RequestInit & { dispatcher?: Agent };
}) {
    const { url, cached, baseInit } = opts;
    const init: RequestInit & { dispatcher?: Agent } = { ...baseInit, method: 'GET', headers: new Headers(baseInit.headers ?? {}) };
    if (cached?.etag) (init.headers as Headers).set('if-none-match', cached.etag);
    if (cached?.lastModified) (init.headers as Headers).set('if-modified-since', cached.lastModified);

    const t0 = performance.now();
    const resp = await fetch(url, init).catch(() => null);
    const t1 = performance.now();
    if (!resp) return;

    const ok = resp.status === 200 || resp.status === 304;
    if (!ok) { if (resp.status >= 400) await delCache(url.href); return; }

    if (resp.status === 304 && cached) {
        const cc = parseCacheControl(resp.headers.get('cache-control'));
        const now = Date.now();
        const ttlSec = cc.sMaxAge ?? cc.maxAge ?? 0;
        const swrSec = cc.staleWhileRevalidate ?? DEFAULT_SWR_SECONDS;
        const newHeaders = copyHeaders(resp.headers);
        const etag = resp.headers.get('etag') ?? cached.etag ?? null;
        const lastModified = resp.headers.get('last-modified') ?? cached.lastModified ?? null;
        if (etag) newHeaders.set('etag', etag);
        if (lastModified) newHeaders.set('last-modified', lastModified);
        if (resp.headers.get('cache-control')) newHeaders.set('cache-control', resp.headers.get('cache-control')!);

        const updated: CacheEntry = {
            ...cached,
            headers: Array.from(newHeaders.entries()),
            etag, lastModified,
            cacheControl: newHeaders.get('cache-control'),
            storedAt: now,
            expiresAt: ttlSec > 0 ? now + ttlSec * 1000 : now,
            swrUntil: now + swrSec * 1000,
        };
        await writeCache(url.href, updated, (ttlSec + swrSec) || 1);
        console.log(`[/api][bg] REVALIDATED 304 ${url.href} in ${Math.round(t1 - t0)}ms`);
        return;
    }

    // 200 -> store fresh
    const cc = parseCacheControl(resp.headers.get('cache-control'));
    const vary = resp.headers.get('vary')?.toLowerCase() ?? '';
    const canStore =
        !resp.headers.has('set-cookie') && !cc.noStore && cc.public === true &&
        (cc.sMaxAge ?? cc.maxAge ?? 0) > 0 && !vary.includes('authorization');
    if (!canStore) return;

    const ttlSec = cc.sMaxAge ?? cc.maxAge ?? 0;
    const swrSec = cc.staleWhileRevalidate ?? DEFAULT_SWR_SECONDS;
    const body = Buffer.from(await resp.arrayBuffer());
    const now = Date.now();
    const entry: CacheEntry = {
        url: url.href,
        status: resp.status,
        statusText: resp.statusText ?? '',
        headers: Array.from(resp.headers.entries()),
        bodyB64: body.toString('base64'),
        etag: resp.headers.get('etag'),
        lastModified: resp.headers.get('last-modified'),
        cacheControl: resp.headers.get('cache-control'),
        storedAt: now,
        expiresAt: now + ttlSec * 1000,
        swrUntil: now + swrSec * 1000,
    };
    await writeCache(url.href, entry, ttlSec + swrSec);
    console.log(`[/api][bg] STORED 200 ${url.href} in ${Math.round(t1 - t0)}ms`);
}

// ---------- Handler (SWR: serve stale, revalidate in background) ----------
async function handler(req: NextRequest) {
    const backend = process.env.BACKEND_URL;
    if (!backend) return new Response('BACKEND_URL not set', { status: 500 });

    const path = req.nextUrl.pathname.replace(/^\/api\//, '');
    const url = new URL(backend);
    url.pathname = joinPath(url.pathname, path);
    url.search = req.nextUrl.search;

    const headers = new Headers(req.headers);
    headers.delete('host'); headers.delete('content-length'); headers.delete('connection');
    headers.set('accept-encoding', 'identity');

    const token = await getSessionToken();
    if (token) headers.set('authorization', `Bearer ${token}`);

    const method = req.method.toUpperCase();
    const init: RequestInit & { dispatcher?: Agent } = {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : (req.body as any),
        ...(method !== 'GET' && method !== 'HEAD' ? { duplex: 'half' as any } : {}),
        dispatcher: agent,
    };

    const hasBackendAuth = !!token;
    const requestNoStore = (req.headers.get('cache-control') || '').toLowerCase().includes('no-store');
    const cacheable =
        method === 'GET' && !hasBackendAuth && !requestNoStore && !req.headers.has('authorization');

    const keyUrl = url.href;
    const cached = cacheable ? await readCache(keyUrl) : null;

    // client 304 from cached validators
    if (method === 'GET' && cached && isClientConditionalHit(req, cached)) {
        const h = copyHeaders(cached.headers, { 'x-proxy-cache': 'HIT-LOCAL-304' });
        return new Response(null, { status: 304, headers: h });
    }

    const now = Date.now();

    // fresh hit
    if (method === 'GET' && cached && now < cached.expiresAt) {
        const body = Buffer.from(cached.bodyB64, 'base64');
        const h = copyHeaders(cached.headers, { 'x-proxy-cache': 'HIT-FRESH' });
        return new Response(body, { status: cached.status, statusText: cached.statusText, headers: h });
    }

    // stale hit -> serve stale & revalidate in bg
    if (method === 'GET' && cached) {
        const withinSWR = cached.swrUntil ? now < cached.swrUntil : (now - cached.expiresAt) < DEFAULT_SWR_SECONDS * 1000;
        const notTooOld = (now - cached.storedAt) < MAX_STALE_SECONDS * 1000;

        if (withinSWR && notTooOld) {
            const gotLock = await acquireLock(keyUrl, 20);
            if (gotLock) {
                schedule(() => revalidateInBackground({ url, cached, baseInit: { ...init, method: 'GET' } }));
            }
            const body = Buffer.from(cached.bodyB64, 'base64');
            const h = copyHeaders(cached.headers, { 'x-proxy-cache': gotLock ? 'HIT-STALE-REVALIDATING' : 'HIT-STALE' });
            return new Response(body, { status: cached.status, statusText: cached.statusText, headers: h });
        }
    }

    // miss -> fetch now
    const t0 = performance.now();
    const resp = await fetch(url, init);
    const t1 = performance.now();

    if (method === 'HEAD') {
        const h = copyHeaders(resp.headers, { 'x-proxy-cache': cached ? 'BYPASS-STALE' : 'BYPASS', 'x-proxy-latency': `${Math.round(t1 - t0)}ms` });
        return new Response(null, { status: resp.status, statusText: resp.statusText, headers: h });
    }

    if (method === 'GET') {
        let outHeaders = copyHeaders(resp.headers, { 'x-proxy-latency': `${Math.round(t1 - t0)}ms` });

        const cc = parseCacheControl(resp.headers.get('cache-control'));
        const vary = resp.headers.get('vary')?.toLowerCase() ?? '';
        const canStore =
            cacheable && resp.status === 200 && !resp.headers.has('set-cookie') &&
            !cc.noStore && cc.public === true && (cc.sMaxAge ?? cc.maxAge ?? 0) > 0 && !vary.includes('authorization');

        if (canStore) {
            const ttlSec = cc.sMaxAge ?? cc.maxAge ?? 0;
            const swrSec = cc.staleWhileRevalidate ?? DEFAULT_SWR_SECONDS;
            const body = Buffer.from(await resp.arrayBuffer());
            const entry: CacheEntry = {
                url: keyUrl,
                status: resp.status,
                statusText: resp.statusText ?? '',
                headers: Array.from(resp.headers.entries()),
                bodyB64: body.toString('base64'),
                etag: resp.headers.get('etag'),
                lastModified: resp.headers.get('last-modified'),
                cacheControl: resp.headers.get('cache-control'),
                storedAt: now,
                expiresAt: now + ttlSec * 1000,
                swrUntil: now + swrSec * 1000,
            };
            await writeCache(keyUrl, entry, ttlSec + swrSec);
            outHeaders = copyHeaders(resp.headers, { 'x-proxy-cache': 'MISS-STORED', 'x-proxy-latency': `${Math.round(t1 - t0)}ms` });
            return new Response(body, { status: resp.status, statusText: resp.statusText, headers: outHeaders });
        }

        if (cached && (resp.headers.get('cache-control')?.toLowerCase().includes('no-store') || resp.status >= 400)) {
            await delCache(keyUrl);
        }

        outHeaders.set('x-proxy-cache', cached ? 'BYPASS-STALE' : 'BYPASS');
        return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: outHeaders });
    }

    // mutations: stream & purge
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if ([200, 201, 202, 204].includes(resp.status)) await delCache(keyUrl);
        const outHeaders = copyHeaders(resp.headers, { 'x-proxy-cache': 'BYPASS', 'x-proxy-latency': `${Math.round(t1 - t0)}ms` });
        return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: outHeaders });
    }

    const outHeaders = copyHeaders(resp.headers, { 'x-proxy-cache': 'BYPASS', 'x-proxy-latency': `${Math.round(t1 - t0)}ms` });
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: outHeaders });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
