import { useMemo } from 'react';
import { getClientApiBaseUrl } from '@/utils/url-resolver';

/**
 * Demo feature data hook.
 * Returns stable, serializable values for client containers.
 */
export function useDemoData() {
  const demoAuthUrl = useMemo(() => {
    return `${getClientApiBaseUrl()}/auth/demo`;
  }, []);

  return {
    demoAuthUrl,
  } as const;
}