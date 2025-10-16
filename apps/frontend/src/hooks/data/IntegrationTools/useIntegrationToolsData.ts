import { useMemo } from 'react';

/**
 * Data hook for the Integration Tools feature.
 * Returns plain, serializable values only.
 */
export function useIntegrationToolsData() {
  return useMemo(
    () => ({
      isAddAvailable: false as const,
    }),
    [],
  );
}