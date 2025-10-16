import { useQuery, queryOptions } from '@tanstack/react-query';

type QueryData = {
  readonly step: 'empty';
};

const integrationsApplicationsOptions = queryOptions({
  queryKey: ['integrations', 'applications', 'meta'] as const,
  queryFn: async (): Promise<QueryData> => {
    return { step: 'empty' };
  },
  staleTime: 60_000,
});

export function useIntegrationsApplicationsData() {
  const { data, isLoading, isError, error, refetch } = useQuery(integrationsApplicationsOptions);

  return {
    step: data?.step ?? 'empty',
    isLoading,
    isError,
    error,
    refetch,
  } as const;
}

export { integrationsApplicationsOptions };