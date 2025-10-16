import { prefetchIntegrationTools } from '@/hooks/data';
import IntegrationToolsContainer from './components/IntegrationToolsContainer';

export default async function Page() {
  // No data to prefetch yet; keep server component free of MUI.
  await prefetchIntegrationTools as unknown;
  return <IntegrationToolsContainer />;
}