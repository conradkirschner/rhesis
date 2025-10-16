import { type QueryClient } from '@tanstack/react-query';
import {
  readTestRunTestRunsTestRunIdGetOptions,
  getTestRunBehaviorsTestRunsTestRunIdBehaviorsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';
import { fetchAllResultsServer } from './useTestRunData';

/** Prefetch primary entities for TestRun feature */
export async function prefetchTestRun(qc: QueryClient, testRunId: string) {
  await qc.prefetchQuery({
    ...readTestRunTestRunsTestRunIdGetOptions({ path: { test_run_id: testRunId } }),
    staleTime: 60_000,
  });

  await fetchAllResultsServer(qc, testRunId);

  await qc.prefetchQuery({
    ...getTestRunBehaviorsTestRunsTestRunIdBehaviorsGetOptions({ path: { test_run_id: testRunId } }),
    staleTime: 5 * 60_000,
  });
}