import { QueryClient } from '@tanstack/react-query';
import { readTestSetsTestSetsGet } from '@/api-client/sdk.gen';
import { readTestSetsTestSetsGetOptions } from '@/api-client/@tanstack/react-query.gen';

/** Prefetch primary list for /test-sets index */
export async function prefetchTestSets(qc: QueryClient, opts: { token: string; baseUrl?: string }) {
  const key = readTestSetsTestSetsGetOptions({
    query: { skip: 0, limit: 25, sort_by: 'created_at', sort_order: 'desc' },
  }).queryKey;

  const res = await readTestSetsTestSetsGet({
    query: { skip: 0, limit: 25, sort_by: 'created_at', sort_order: 'desc' },
    headers: { Authorization: `Bearer ${opts.token}` },
    baseUrl: opts.baseUrl,
  });

  await qc.setQueryData(key, res.data);
}