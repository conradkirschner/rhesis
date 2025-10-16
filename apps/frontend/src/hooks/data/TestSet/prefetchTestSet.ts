import type { QueryClient } from '@tanstack/react-query';
import {
  readTestSetTestSetsTestSetIdentifierGetOptions,
  generateTestSetTestStatsTestSetsTestSetIdentifierStatsGetOptions,
  getTestSetTestsTestSetsTestSetIdentifierTestsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

export async function prefetchTestSet(client: QueryClient, identifier: string) {
  if (!identifier) return;

  await client.prefetchQuery({
    ...readTestSetTestSetsTestSetIdentifierGetOptions({
      path: { test_set_identifier: identifier },
    }),
    staleTime: 60_000,
  });

  await client.prefetchQuery({
    ...generateTestSetTestStatsTestSetsTestSetIdentifierStatsGetOptions({
      path: { test_set_identifier: identifier },
      query: { top: 5, months: 6, mode: 'related_entity' },
    }),
    staleTime: 60_000,
  });

  await client.prefetchQuery({
    ...getTestSetTestsTestSetsTestSetIdentifierTestsGetOptions({
      path: { test_set_identifier: identifier },
      query: { skip: 0, limit: 50, order_by: 'topic', order: 'asc' },
    }),
    staleTime: 30_000,
  });
}